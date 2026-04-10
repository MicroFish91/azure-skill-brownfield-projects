import { IStorageService } from '../../src/services/interfaces/IStorageService';

export class MockStorageService implements IStorageService {
  private blobs: Map<string, Buffer> = new Map();

  private getKey(container: string, blobName: string): string {
    return `${container}/${blobName}`;
  }

  async upload(container: string, blobName: string, data: Buffer, _contentType: string): Promise<string> {
    const key = this.getKey(container, blobName);
    this.blobs.set(key, data);
    return this.getUrl(container, blobName);
  }

  async download(container: string, blobName: string): Promise<Buffer> {
    const key = this.getKey(container, blobName);
    const data = this.blobs.get(key);
    if (!data) {
      throw new Error(`Blob not found: ${key}`);
    }
    return data;
  }

  async delete(container: string, blobName: string): Promise<boolean> {
    const key = this.getKey(container, blobName);
    return this.blobs.delete(key);
  }

  getUrl(container: string, blobName: string): string {
    return `https://teststorage.blob.core.windows.net/${container}/${blobName}`;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  clear(): void {
    this.blobs.clear();
  }
}
