import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface ProcessedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  async process(
    file: Express.Multer.File,
    options: ProcessOptions = {},
  ): Promise<ProcessedFile> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
      fit = 'cover',
      withoutEnlargement = true,
    } = options;

    try {
      let pipeline = sharp(file.buffer);

      if (width || height) {
        pipeline = pipeline.resize({
          width,
          height,
          fit,
          withoutEnlargement,
        });
      }

      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ quality });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality });
          break;
        case 'webp':
        default:
          pipeline = pipeline.webp({ quality });
          break;
      }

      const buffer = await pipeline.toBuffer();
      const mimetype = `image/${format}`;

      return { buffer, mimetype, size: buffer.length };
    } catch (err) {
      this.logger.error(`Image processing failed: ${err.message}`);
      return {
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.buffer.length,
      };
    }
  }

  async generateThumbnail(
    file: Express.Multer.File,
    size = 200,
  ): Promise<ProcessedFile> {
    return this.process(file, {
      width: size,
      height: size,
      format: 'webp',
      quality: 70,
      fit: 'cover',
    });
  }

  async generateResponsiveSizes(
    file: Express.Multer.File,
  ): Promise<{ size: string; file: ProcessedFile }[]> {
    const sizes = [
      { label: 'sm', width: 400 },
      { label: 'md', width: 800 },
      { label: 'lg', width: 1200 },
      { label: 'xl', width: 1600 },
    ];

    const results: { size: string; file: ProcessedFile }[] = [];
    for (const s of sizes) {
      const processed = await this.process(file, {
        width: s.width,
        format: 'webp',
        quality: 80,
        fit: 'inside',
        withoutEnlargement: true,
      });
      results.push({ size: s.label, file: processed });
    }
    return results;
  }
}
