import { Pool, type PoolClient } from 'pg';
import type { AppConfig } from '../config.js';

let pool: Pool | null = null;

export function getPool(config: AppConfig): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl, max: 5 });
  }
  return pool;
}

export async function withClient<T>(
  config: AppConfig,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool(config).connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function resetPoolForTesting(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
