import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { IStorageService } from './interfaces/IStorageService';

export class AzureBlobStorageService implements IStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor(connectionString: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  private getContainerClient(container: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(container);
  }

  async upload(container: string, blobName: string, data: Buffer, contentType: string): Promise<string> {
    const containerClient = this.getContainerClient(container);
    await containerClient.createIfNotExists({ access: 'blob' });
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  async download(container: string, blobName: string): Promise<Buffer> {
    const containerClient = this.getContainerClient(container);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const response = await blockBlobClient.download(0);
    const chunks: Buffer[] = [];
    if (response.readableStreamBody) {
      for await (const chunk of response.readableStreamBody) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    }
    return Buffer.concat(chunks);
  }

  async delete(container: string, blobName: string): Promise<boolean> {
    try {
      const containerClient = this.getContainerClient(container);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      return true;
    } catch {
      return false;
    }
  }

  getUrl(container: string, blobName: string): string {
    const containerClient = this.getContainerClient(container);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
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
