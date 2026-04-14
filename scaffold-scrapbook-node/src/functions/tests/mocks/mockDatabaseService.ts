import type { IDatabaseService, QueryOptions } from '../../src/services/interfaces/IDatabaseService.js';
import { v4 as uuid } from 'uuid';

export class MockDatabaseService implements IDatabaseService {
  private store: Map<string, Map<string, Record<string, unknown>>> = new Map();

  constructor(initialData?: Record<string, Record<string, unknown>[]>) {
    if (initialData) {
      for (const [collection, items] of Object.entries(initialData)) {
        const map = new Map<string, Record<string, unknown>>();
        for (const item of items) {
          map.set(item.id as string, { ...item });
        }
        this.store.set(collection, map);
      }
    }
  }

  private getCollection(collection: string): Map<string, Record<string, unknown>> {
    if (!this.store.has(collection)) {
      this.store.set(collection, new Map());
    }
    return this.store.get(collection)!;
  }

  async findAll<T>(collection: string, options?: QueryOptions): Promise<T[]> {
    const col = this.getCollection(collection);
    let items = Array.from(col.values());

    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        items = items.filter((item) => item[key] === value);
      }
    }

    if (options?.orderBy) {
      items.sort((a, b) => {
        const aVal = String(a[options.orderBy!] ?? '');
        const bVal = String(b[options.orderBy!] ?? '');
        return options.orderDirection === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });
    }

    if (options?.offset) {
      items = items.slice(options.offset);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items as T[];
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const col = this.getCollection(collection);
    const item = col.get(id);
    return (item as T) ?? null;
  }

  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    const col = this.getCollection(collection);
    for (const item of col.values()) {
      const matches = Object.entries(filter).every(([k, v]) => item[k] === v);
      if (matches) return item as T;
    }
    return null;
  }

  async create<T>(collection: string, data: T): Promise<T> {
    const col = this.getCollection(collection);
    const record = data as Record<string, unknown>;
    const id = (record.id as string) || uuid();
    const now = new Date().toISOString();
    const item = {
      ...record,
      id,
      createdAt: record.createdAt ?? now,
      updatedAt: record.updatedAt ?? now,
    };
    col.set(id, item);
    return item as T;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const col = this.getCollection(collection);
    const existing = col.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...(data as Record<string, unknown>),
      id,
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
    const col = this.getCollection(collection);
    if (!filter) return col.size;
    let count = 0;
    for (const item of col.values()) {
      const matches = Object.entries(filter).every(([k, v]) => item[k] === v);
      if (matches) count++;
    }
    return count;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T> {
    return fn(this);
  }
}
