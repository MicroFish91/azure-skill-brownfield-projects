import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  type ContainerClient
} from '@azure/storage-blob';
import type { AppConfig } from '../config.js';
import type { IBlobStorage, UploadResult } from '../interfaces/IBlobStorage.js';

export class AzureBlobStorage implements IBlobStorage {
  private readonly container: ContainerClient;
  private readonly serviceClient: BlobServiceClient;
  private containerEnsured = false;

  constructor(private readonly config: AppConfig) {
    this.serviceClient = BlobServiceClient.fromConnectionString(config.storageConnectionString);
    this.container = this.serviceClient.getContainerClient(config.photoContainerName);
  }

  private async ensureContainer(): Promise<void> {
    if (this.containerEnsured) return;
    await this.container.createIfNotExists();
    this.containerEnsured = true;
  }

  async upload(blobPath: string, data: Buffer, contentType: string): Promise<UploadResult> {
    await this.ensureContainer();
    const block = this.container.getBlockBlobClient(blobPath);
    await block.uploadData(data, { blobHTTPHeaders: { blobContentType: contentType } });
    return { blobPath };
  }

  async delete(blobPath: string): Promise<void> {
    await this.container.getBlockBlobClient(blobPath).deleteIfExists();
  }

  async getReadUrl(blobPath: string, ttlSeconds = 60 * 60): Promise<string> {
    const block = this.container.getBlockBlobClient(blobPath);
    // Use SAS only when we have account-key credential available.
    const cred = this.extractSharedKey();
    if (!cred) {
      // Fallback to direct URL (works with public container or AAD-managed access).
      return block.url;
    }
    const expiresOn = new Date(Date.now() + ttlSeconds * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.container.containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn
      },
      cred
    ).toString();
    return `${block.url}?${sas}`;
  }

  async ping(): Promise<void> {
    await this.serviceClient.getProperties();
  }

  private extractSharedKey(): StorageSharedKeyCredential | null {
    const cs = this.config.storageConnectionString;
    const accountMatch = /AccountName=([^;]+)/i.exec(cs);
    const keyMatch = /AccountKey=([^;]+)/i.exec(cs);
    if (!accountMatch || !keyMatch) return null;
    try {
      return new StorageSharedKeyCredential(accountMatch[1], keyMatch[1]);
    } catch {
      return null;
    }
  }
}
