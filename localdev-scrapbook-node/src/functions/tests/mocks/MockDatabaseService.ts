import { v4 as uuidv4 } from 'uuid';
import { IDatabaseService } from '../../src/services/interfaces/IDatabaseService';

export class MockDatabaseService implements IDatabaseService {
  private collections: Map<string, Map<string, Record<string, unknown>>> = new Map();

  private getCollection(collection: string): Map<string, Record<string, unknown>> {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Map());
    }
    return this.collections.get(collection)!;
  }

  async findAll<T>(collection: string, filter?: Record<string, unknown>): Promise<T[]> {
    const col = this.getCollection(collection);
    let items = Array.from(col.values());

    if (filter && Object.keys(filter).length > 0) {
      items = items.filter((item) =>
        Object.entries(filter).every(([key, value]) => item[key] === value)
      );
    }

    items.sort((a, b) => {
      const aTime = new Date(a.createdAt as string).getTime();
      const bTime = new Date(b.createdAt as string).getTime();
      return bTime - aTime;
    });

    return items as T[];
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const col = this.getCollection(collection);
    const item = col.get(id);
    return (item as T) || null;
  }

  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    const col = this.getCollection(collection);
    for (const item of col.values()) {
      const matches = Object.entries(filter).every(([key, value]) => item[key] === value);
      if (matches) return item as T;
    }
    return null;
  }

  async create<T>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const col = this.getCollection(collection);
    const id = uuidv4();
    const now = new Date().toISOString();

    const inputData = { ...data } as Record<string, unknown>;
    delete inputData['id'];
    delete inputData['createdAt'];
    delete inputData['updatedAt'];

    const record: Record<string, unknown> = {
      ...inputData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    col.set(id, record);
    return record as T;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const col = this.getCollection(collection);
    const existing = col.get(id);
    if (!existing) return null;

    const inputData = { ...data } as Record<string, unknown>;
    delete inputData['id'];
    delete inputData['createdAt'];
    delete inputData['updatedAt'];

    const updated: Record<string, unknown> = {
      ...existing,
      ...inputData,
      updatedAt: new Date().toISOString(),
    };

    col.set(id, updated);
    return updated as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const col = this.getCollection(collection);
    return col.delete(id);
  }

  async count(collection: string, filter?: Record<string, unknown>): Promise<number> {
    const items = await this.findAll(collection, filter);
    return items.length;
  }

  async transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  clear(): void {
    this.collections.clear();
  }
}
