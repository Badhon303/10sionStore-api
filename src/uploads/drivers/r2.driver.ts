import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageDriver, UploadResult } from '../storage.interface';

@Injectable()
export class R2Driver implements StorageDriver {
  private readonly logger = new Logger(R2Driver.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicDomain: string;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('CF_ACCOUNT_ID') || '';
    this.bucket = config.get<string>('CF_R2_BUCKET_NAME') || '';
    this.publicDomain =
      config.get<string>('CF_R2_PUBLIC_DOMAIN') || '';

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.get<string>('CF_R2_ACCESS_KEY_ID') || '',
        secretAccessKey: config.get<string>('CF_R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async upload(file: Express.Multer.File, key: string): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      path: key,
      url: this.getUrl(key),
      size: file.buffer.length,
      mimeType: file.mimetype,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch {
      this.logger.warn(`Failed to delete ${key} from R2`);
    }
  }

  getUrl(key: string): string {
    return `${this.publicDomain}/${key}`;
  }
}
