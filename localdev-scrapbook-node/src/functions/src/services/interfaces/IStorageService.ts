export interface IStorageService {
  upload(container: string, blobName: string, data: Buffer, contentType: string): Promise<string>;
  download(container: string, blobName: string): Promise<Buffer>;
  delete(container: string, blobName: string): Promise<boolean>;
  getUrl(container: string, blobName: string): string;
  healthCheck(): Promise<boolean>;
}
