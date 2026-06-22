export const STORAGE_DRIVER = 'STORAGE_DRIVER';

export interface UploadResult {
  path: string; // stored key/path
  url: string; // public URL
  size: number;
  mimeType: string;
}

export interface StorageDriver {
  upload(file: Express.Multer.File, path: string): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}
