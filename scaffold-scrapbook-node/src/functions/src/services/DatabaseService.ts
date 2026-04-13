import pg from 'pg';
import type { IDatabaseService, QueryOptions } from './interfaces/IDatabaseService.js';
import { logger } from '../logger.js';

const { Pool } = pg;

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function keysToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnake(key)] = value;
  }
  return result;
}

function keysToCamel<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamel(key)] = value;
  }
  return result as T;
}

const AUTO_MANAGED_FIELDS = ['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];

function stripAutoManaged(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!AUTO_MANAGED_FIELDS.includes(key) && !AUTO_MANAGED_FIELDS.includes(toSnake(key))) {
      result[key] = value;
    }
  }
  return result;
}

function collectionToTable(collection: string): string {
  const mapping: Record<string, string> = {
    user: 'users',
    couple: 'couples',
    photo: 'photos',
  };
  return mapping[collection] ?? collection;
}

export class DatabaseService implements IDatabaseService {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async findAll<T>(collection: string, options?: QueryOptions): Promise<T[]> {
    const table = collectionToTable(collection);
    let query = `SELECT * FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.filter) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(options.filter)) {
        conditions.push(`${toSnake(key)} = $${paramIndex++}`);
        params.push(value);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${toSnake(options.orderBy)} ${options.orderDirection ?? 'asc'}`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => keysToCamel<T>(row));
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const table = collectionToTable(collection);
    const result = await this.pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    const table = collectionToTable(collection);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filter)) {
      conditions.push(`${toSnake(key)} = $${paramIndex++}`);
      params.push(value);
    }

    const query = `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')} LIMIT 1`;
    const result = await this.pool.query(query, params);
    if (result.rows.length === 0) return null;
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async create<T>(collection: string, data: T): Promise<T> {
    const table = collectionToTable(collection);
    const snakeData = keysToSnake(stripAutoManaged(data as Record<string, unknown>));
    const columns = Object.keys(snakeData);
    const values = Object.values(snakeData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const result = await this.pool.query(query, values);
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const table = collectionToTable(collection);
    const snakeData = keysToSnake(stripAutoManaged(data as Record<string, unknown>));
    const entries = Object.entries(snakeData);
    if (entries.length === 0) return this.findById<T>(collection, id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`);
    const values = entries.map(([, value]) => value);
    values.push(id);

    const query = `UPDATE ${table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const table = collectionToTable(collection);
    const result = await this.pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(collection: string, filter?: Record<string, unknown>): Promise<number> {
    const table = collectionToTable(collection);
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(filter)) {
        conditions.push(`${toSnake(key)} = $${paramIndex++}`);
        params.push(value);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count as string, 10);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const trxService = new TransactionDatabaseService(client);
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
}

class TransactionDatabaseService implements IDatabaseService {
  constructor(private client: pg.PoolClient) {}

  async findAll<T>(collection: string, options?: QueryOptions): Promise<T[]> {
    const table = collectionToTable(collection);
    let query = `SELECT * FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.filter) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(options.filter)) {
        conditions.push(`${toSnake(key)} = $${paramIndex++}`);
        params.push(value);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${toSnake(options.orderBy)} ${options.orderDirection ?? 'asc'}`;
    }

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await this.client.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => keysToCamel<T>(row));
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const table = collectionToTable(collection);
    const result = await this.client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
    const table = collectionToTable(collection);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filter)) {
      conditions.push(`${toSnake(key)} = $${paramIndex++}`);
      params.push(value);
    }

    const query = `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')} LIMIT 1`;
    const result = await this.client.query(query, params);
    if (result.rows.length === 0) return null;
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async create<T>(collection: string, data: T): Promise<T> {
    const table = collectionToTable(collection);
    const snakeData = keysToSnake(stripAutoManaged(data as Record<string, unknown>));
    const columns = Object.keys(snakeData);
    const values = Object.values(snakeData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const result = await this.client.query(query, values);
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const table = collectionToTable(collection);
    const snakeData = keysToSnake(stripAutoManaged(data as Record<string, unknown>));
    const entries = Object.entries(snakeData);
    if (entries.length === 0) return this.findById<T>(collection, id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`);
    const values = entries.map(([, value]) => value);
    values.push(id);

    const query = `UPDATE ${table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    const result = await this.client.query(query, values);
    if (result.rows.length === 0) return null;
    return keysToCamel<T>(result.rows[0] as Record<string, unknown>);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const table = collectionToTable(collection);
    const result = await this.client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(collection: string, filter?: Record<string, unknown>): Promise<number> {
    const table = collectionToTable(collection);
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(filter)) {
        conditions.push(`${toSnake(key)} = $${paramIndex++}`);
        params.push(value);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    const result = await this.client.query(query, params);
    return parseInt(result.rows[0].count as string, 10);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async transaction<T>(fn: (trx: IDatabaseService) => Promise<T>): Promise<T> {
    return fn(this);
  }
}
