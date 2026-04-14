export interface IStorageService {
  upload(container: string, name: string, data: Buffer, contentType?: string): Promise<string>;
  download(container: string, name: string): Promise<Buffer>;
  list(container: string): Promise<string[]>;
  delete(container: string, name: string): Promise<void>;
  getUrl(container: string, name: string): string;
  healthCheck(): Promise<boolean>;
}
