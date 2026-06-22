import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_DRIVER, StorageDriver, UploadResult } from './storage.interface';
import { ImageProcessorService, ProcessedFile } from './image-processor.service';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
    private readonly imageProcessor: ImageProcessorService,
    private readonly config: ConfigService,
  ) {}

  async uploadSingle(
    file: Express.Multer.File,
    folder: string,
    processImage = true,
  ): Promise<UploadResult> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    let fileToUpload = file;
    if (processImage && file.mimetype.startsWith('image/')) {
      const processed = await this.imageProcessor.process(file, {
        format: 'webp',
        quality: 80,
        fit: 'inside',
        withoutEnlargement: true,
      });
      fileToUpload = this.toMulterFile(processed, `${uuidv4()}.webp`, 'image/webp');
    }

    return this.driver.upload(fileToUpload, key);
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string,
    processImage = true,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await this.uploadSingle(file, folder, processImage);
      results.push(result);
    }
    return results;
  }

  async uploadWithThumbnails(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ original: UploadResult; thumbnail: UploadResult }> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const baseKey = `${folder}/${uuidv4()}`;

    const processed = await this.imageProcessor.process(file, {
      format: 'webp',
      quality: 80,
      fit: 'inside',
      withoutEnlargement: true,
    });
    const original = await this.driver.upload(
      this.toMulterFile(processed, `${baseKey}.webp`, 'image/webp'),
      `${baseKey}.webp`,
    );

    const thumbProcessed = await this.imageProcessor.generateThumbnail(file, 300);
    const thumbnail = await this.driver.upload(
      this.toMulterFile(thumbProcessed, `${baseKey}_thumb.webp`, 'image/webp'),
      `${baseKey}_thumb.webp`,
    );

    return { original, thumbnail };
  }

  async uploadResponsive(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ size: string; result: UploadResult }[]> {
    const baseKey = `${folder}/${uuidv4()}`;
    const responsive = await this.imageProcessor.generateResponsiveSizes(file);

    const results: { size: string; result: UploadResult }[] = [];
    for (const { size, file: processed } of responsive) {
      const key = `${baseKey}_${size}.webp`;
      const result = await this.driver.upload(
        this.toMulterFile(processed, key, 'image/webp'),
        key,
      );
      results.push({ size, result });
    }
    return results;
  }

  async delete(path: string): Promise<void> {
    await this.driver.delete(path);
  }

  getUrl(path: string): string {
    return this.driver.getUrl(path);
  }

  private toMulterFile(
    processed: ProcessedFile,
    originalname: string,
    mimetype: string,
  ): Express.Multer.File {
    return {
      buffer: processed.buffer,
      originalname,
      mimetype,
      size: processed.size,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: originalname,
      path: '',
    } as Express.Multer.File;
  }
}
