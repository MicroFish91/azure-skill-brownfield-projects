import type { Couple } from '@app/shared';
import type { AppConfig } from '../config.js';
import type { ICoupleRepository } from '../interfaces/ICoupleRepository.js';
import { withClient } from './pool.js';

interface CoupleRow {
  id: string;
  invite_code: string;
  created_at: Date;
  updated_at: Date;
}

interface MemberRow {
  id: string;
  display_name: string;
  email: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function loadMembers(c: import('pg').PoolClient, coupleId: string): Promise<MemberRow[]> {
  const r = await c.query<MemberRow>(
    'SELECT id, display_name, email FROM users WHERE couple_id = $1 ORDER BY created_at ASC',
    [coupleId]
  );
  return r.rows;
}

function mapRow(row: CoupleRow, members: MemberRow[]): Couple {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    members: members.map((m) => ({ id: m.id, displayName: m.display_name, email: m.email }))
  };
}

export class PostgresCoupleRepository implements ICoupleRepository {
  constructor(private readonly config: AppConfig) {}

  async findById(id: string): Promise<Couple | null> {
    return withClient(this.config, async (c) => {
      const r = await c.query<CoupleRow>('SELECT * FROM couples WHERE id = $1', [id]);
      if (!r.rows[0]) return null;
      const members = await loadMembers(c, id);
      return mapRow(r.rows[0], members);
    });
  }

  async findByInviteCode(inviteCode: string): Promise<Couple | null> {
    return withClient(this.config, async (c) => {
      const r = await c.query<CoupleRow>('SELECT * FROM couples WHERE invite_code = $1', [
        inviteCode
      ]);
      if (!r.rows[0]) return null;
      const members = await loadMembers(c, r.rows[0].id);
      return mapRow(r.rows[0], members);
    });
  }

  async create(): Promise<Couple> {
    return withClient(this.config, async (c) => {
      // Retry a couple of times on rare invite_code collision.
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateInviteCode();
        const r = await c.query<CoupleRow>(
          'INSERT INTO couples (invite_code) VALUES ($1) ON CONFLICT (invite_code) DO NOTHING RETURNING *',
          [code]
        );
        if (r.rows[0]) return mapRow(r.rows[0], []);
      }
      throw new Error('Failed to allocate unique invite code');
    });
  }
}
