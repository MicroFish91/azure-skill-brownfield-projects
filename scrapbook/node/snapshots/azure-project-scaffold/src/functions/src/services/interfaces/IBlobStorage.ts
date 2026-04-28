export interface UploadResult {
  blobPath: string;
}

export interface IBlobStorage {
  upload(blobPath: string, data: Buffer, contentType: string): Promise<UploadResult>;
  delete(blobPath: string): Promise<void>;
  getReadUrl(blobPath: string, ttlSeconds?: number): Promise<string>;
  ping(): Promise<void>;
}
