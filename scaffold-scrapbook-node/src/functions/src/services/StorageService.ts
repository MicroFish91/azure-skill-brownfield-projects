import { BlobServiceClient } from '@azure/storage-blob';
import type { IStorageService } from './interfaces/IStorageService.js';

export class StorageService implements IStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor(connectionString: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async upload(container: string, name: string, data: Buffer, contentType?: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(container);
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(name);
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: contentType ? { blobContentType: contentType } : undefined,
    });
    return blockBlobClient.url;
  }

  async download(container: string, name: string): Promise<Buffer> {
    const containerClient = this.blobServiceClient.getContainerClient(container);
    const blockBlobClient = containerClient.getBlockBlobClient(name);
    const response = await blockBlobClient.downloadToBuffer();
    return response;
  }

  async list(container: string): Promise<string[]> {
    const containerClient = this.blobServiceClient.getContainerClient(container);
    const names: string[] = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      names.push(blob.name);
    }
    return names;
  }

  async delete(container: string, name: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(container);
    const blockBlobClient = containerClient.getBlockBlobClient(name);
    await blockBlobClient.deleteIfExists();
  }

  getUrl(container: string, name: string): string {
    const containerClient = this.blobServiceClient.getContainerClient(container);
    return containerClient.getBlockBlobClient(name).url;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const iter = this.blobServiceClient.listContainers();
      await iter.next();
      return true;
    } catch {
      return false;
    }
  }
}
