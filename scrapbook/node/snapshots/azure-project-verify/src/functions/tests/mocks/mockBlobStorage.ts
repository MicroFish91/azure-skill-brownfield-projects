import type { IBlobStorage, UploadResult } from '../../src/services/interfaces/IBlobStorage.js';

export class MockBlobStorage implements IBlobStorage {
  public uploads = new Map<string, { data: Buffer; contentType: string }>();
  public deleted: string[] = [];
  public shouldFailUpload = false;
  public shouldFailPing = false;

  async upload(blobPath: string, data: Buffer, contentType: string): Promise<UploadResult> {
    if (this.shouldFailUpload) throw new Error('mock blob upload failure');
    this.uploads.set(blobPath, { data, contentType });
    return { blobPath };
  }

  async delete(blobPath: string): Promise<void> {
    this.deleted.push(blobPath);
    this.uploads.delete(blobPath);
  }

  async getReadUrl(blobPath: string): Promise<string> {
    return `https://mock.example/blobs/${encodeURIComponent(blobPath)}`;
  }

  async ping(): Promise<void> {
    if (this.shouldFailPing) throw new Error('mock blob unhealthy');
  }
}
