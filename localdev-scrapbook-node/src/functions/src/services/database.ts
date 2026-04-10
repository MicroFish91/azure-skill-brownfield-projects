import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { IDatabaseService } from './interfaces/IDatabaseService';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function objectKeysToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

function objectKeysToCamel<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
}

function collectionToTable(collection: string): string {
  return camelToSnake(collection) + 's';
}

export class PostgresDatabaseService implements IDatabaseService {
  private pool: Pool;
  private client: PoolClient | null = null;

  constructor(connectionString: string);
  constructor(client: PoolClient);
  constructor(arg: string | PoolClient) {
    if (typeof arg === 'string') {
      this.pool = new Pool({ connectionString: arg });
    } else {
      this.pool = null as unknown as Pool;
      this.client = arg;
    }
  }

  private async query(text: string, params?: unknown[]) {
    if (this.client) {
      return this.client.query(text, params);
    }
    return this.pool.query(text, params);
  }

  async findAll<T>(collection: string, filter?: Record<string, unknown>): Promise<T[]> {
    const table = collectionToTable(collection);
    let text = `SELECT * FROM ${table}`;
    const params: unknown[] = [];

    if (filter && Object.keys(filter).length > 0) {
      const snakeFilter = objectKeysToSnake(filter);
      const conditions = Object.keys(snakeFilter).map((key, i) => {
        params.push(snakeFilter[key]);
        return `${key} = $${i + 1}`;
      });
      text += ` WHERE ${conditions.join(' AND ')}`;
    }

    text += ' ORDER BY created_at DESC';
    const result = await this.query(text, params);
    return result.rows.map((row: Record<string, unknown>) => objectKeysToCamel<T>(row));
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const table = collectionToTable(collection);
    const result = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return objectKeysToCamel<T>(result.rows[0]);
  }

  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    const table = collectionToTable(collection);
    const snakeFilter = objectKeysToSnake(filter);
    const keys = Object.keys(snakeFilter);
    const params = keys.map((key) => snakeFilter[key]);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`);

    const result = await this.query(
      `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')} LIMIT 1`,
      params
    );
    if (result.rows.length === 0) return null;
    return objectKeysToCamel<T>(result.rows[0]);
  }

  async create<T>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const table = collectionToTable(collection);
    const id = uuidv4();
    const now = new Date().toISOString();

    const inputData = { ...data } as Record<string, unknown>;
    delete inputData['id'];
    delete inputData['createdAt'];
    delete inputData['updatedAt'];

    const snakeData = objectKeysToSnake(inputData);
    snakeData['id'] = id;
    snakeData['created_at'] = now;
    snakeData['updated_at'] = now;

    const keys = Object.keys(snakeData);
    const values = keys.map((key) => snakeData[key]);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const result = await this.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return objectKeysToCamel<T>(result.rows[0]);
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const table = collectionToTable(collection);
    const inputData = { ...data } as Record<string, unknown>;
    delete inputData['id'];
    delete inputData['createdAt'];
    delete inputData['updatedAt'];

    const snakeData = objectKeysToSnake(inputData);
    snakeData['updated_at'] = new Date().toISOString();

    const keys = Object.keys(snakeData);
    const values = keys.map((key) => snakeData[key]);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
    values.push(id);

    const result = await this.query(
      `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return null;
    return objectKeysToCamel<T>(result.rows[0]);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const table = collectionToTable(collection);
    const result = await this.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(collection: string, filter?: Record<string, unknown>): Promise<number> {
    const table = collectionToTable(collection);
    let text = `SELECT COUNT(*)::int as count FROM ${table}`;
    const params: unknown[] = [];

    if (filter && Object.keys(filter).length > 0) {
      const snakeFilter = objectKeysToSnake(filter);
      const conditions = Object.keys(snakeFilter).map((key, i) => {
        params.push(snakeFilter[key]);
        return `${key} = $${i + 1}`;
      });
      text += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.query(text, params);
    return result.rows[0].count;
  }

  async transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const trxService = new PostgresDatabaseService(client);
      const result = await fn(trxService);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
