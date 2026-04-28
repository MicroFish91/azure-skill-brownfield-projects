import type { User } from '@app/shared';
import type { AppConfig } from '../config.js';
import type { CreateUserInput, IUserRepository } from '../interfaces/IUserRepository.js';
import { withClient, getPool } from './pool.js';

interface UserRow {
  id: string;
  entra_object_id: string;
  email: string;
  display_name: string;
  couple_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    entraObjectId: row.entra_object_id,
    email: row.email,
    displayName: row.display_name,
    coupleId: row.couple_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly config: AppConfig) {}

  async findByEntraObjectId(entraObjectId: string): Promise<User | null> {
    return withClient(this.config, async (c) => {
      const r = await c.query<UserRow>('SELECT * FROM users WHERE entra_object_id = $1', [
        entraObjectId
      ]);
      return r.rows[0] ? mapRow(r.rows[0]) : null;
    });
  }

  async findById(id: string): Promise<User | null> {
    return withClient(this.config, async (c) => {
      const r = await c.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
      return r.rows[0] ? mapRow(r.rows[0]) : null;
    });
  }

  async create(input: CreateUserInput): Promise<User> {
    return withClient(this.config, async (c) => {
      const r = await c.query<UserRow>(
        `INSERT INTO users (entra_object_id, email, display_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [input.entraObjectId, input.email, input.displayName]
      );
      return mapRow(r.rows[0]);
    });
  }

  async setCoupleId(userId: string, coupleId: string | null): Promise<User> {
    return withClient(this.config, async (c) => {
      const r = await c.query<UserRow>(
        `UPDATE users SET couple_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [coupleId, userId]
      );
      return mapRow(r.rows[0]);
    });
  }

  async countByCoupleId(coupleId: string): Promise<number> {
    return withClient(this.config, async (c) => {
      const r = await c.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users WHERE couple_id = $1',
        [coupleId]
      );
      return Number(r.rows[0].count);
    });
  }

  async listByCoupleId(coupleId: string): Promise<User[]> {
    return withClient(this.config, async (c) => {
      const r = await c.query<UserRow>(
        'SELECT * FROM users WHERE couple_id = $1 ORDER BY created_at ASC',
        [coupleId]
      );
      return r.rows.map(mapRow);
    });
  }

  async ping(): Promise<void> {
    await getPool(this.config).query('SELECT 1');
  }
}
