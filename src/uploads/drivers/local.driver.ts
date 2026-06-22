import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageDriver, UploadResult } from '../storage.interface';

@Injectable()
export class LocalDriver implements StorageDriver {
  private readonly logger = new Logger(LocalDriver.name);
  private readonly uploadPath: string;
  private readonly serveUrl: string;

  constructor(config: ConfigService) {
    this.uploadPath = config.get<string>('LOCAL_UPLOAD_PATH') || './uploads';
    this.serveUrl = config.get<string>('LOCAL_SERVE_URL') || 'http://localhost:3000/static';
  }

  async upload(file: Express.Multer.File, key: string): Promise<UploadResult> {
    const dest = path.join(this.uploadPath, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, file.buffer);
    return {
      path: key,
      url: this.getUrl(key),
      size: file.buffer.length,
      mimeType: file.mimetype,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.uploadPath, key));
    } catch {
      this.logger.warn(`Failed to delete ${key}`);
    }
  }

  getUrl(key: string): string {
    return `${this.serveUrl}/${key}`;
  }
}
