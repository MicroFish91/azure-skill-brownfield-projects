export interface IDatabaseService {
  findAll<T>(collection: string, filter?: Record<string, unknown>): Promise<T[]>;
  findById<T>(collection: string, id: string): Promise<T | null>;
  findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null>;
  create<T>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(collection: string, id: string): Promise<boolean>;
  count(collection: string, filter?: Record<string, unknown>): Promise<number>;
  transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}
