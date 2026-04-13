import type { IStorageService } from '../../src/services/interfaces/IStorageService.js';

export class MockStorageService implements IStorageService {
  private store: Map<string, Map<string, Buffer>> = new Map();

  private getContainer(container: string): Map<string, Buffer> {
    if (!this.store.has(container)) {
      this.store.set(container, new Map());
    }
    return this.store.get(container)!;
  }

  async upload(container: string, name: string, data: Buffer, _contentType?: string): Promise<string> {
    const c = this.getContainer(container);
    c.set(name, data);
    return `https://mock.blob.core.windows.net/${container}/${name}`;
  }

  async download(container: string, name: string): Promise<Buffer> {
    const c = this.getContainer(container);
    const data = c.get(name);
    if (!data) throw new Error(`Blob not found: ${container}/${name}`);
    return data;
  }

  async list(container: string): Promise<string[]> {
    const c = this.getContainer(container);
    return Array.from(c.keys());
  }

  async delete(container: string, name: string): Promise<void> {
    const c = this.getContainer(container);
    c.delete(name);
  }

  getUrl(container: string, name: string): string {
    return `https://mock.blob.core.windows.net/${container}/${name}`;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
