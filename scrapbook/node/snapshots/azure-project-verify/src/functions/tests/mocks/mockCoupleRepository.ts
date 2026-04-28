import { randomUUID } from 'node:crypto';
import type { Couple } from '@app/shared';
import type { ICoupleRepository } from '../../src/services/interfaces/ICoupleRepository.js';
import type { MockUserRepository } from './mockUserRepository.js';

export class MockCoupleRepository implements ICoupleRepository {
  public couples = new Map<string, Omit<Couple, 'members'>>();

  /**
   * Member lookup goes through the user repo so couple.members reflects the
   * current set of users with that couple_id (matches Postgres behavior).
   */
  constructor(private readonly users: MockUserRepository) {}

  private withMembers(c: Omit<Couple, 'members'>): Couple {
    const members = [...this.users.users.values()]
      .filter((u) => u.coupleId === c.id)
      .map((u) => ({ id: u.id, displayName: u.displayName, email: u.email }));
    return { ...c, members };
  }

  async findById(id: string): Promise<Couple | null> {
    const c = this.couples.get(id);
    return c ? this.withMembers(c) : null;
  }

  async findByInviteCode(inviteCode: string): Promise<Couple | null> {
    for (const c of this.couples.values()) {
      if (c.inviteCode === inviteCode) return this.withMembers(c);
    }
    return null;
  }

  async create(): Promise<Couple> {
    const now = new Date().toISOString();
    const couple: Omit<Couple, 'members'> = {
      id: randomUUID(),
      inviteCode: `MOCK-${Math.floor(Math.random() * 1_000_000).toString(36).toUpperCase()}`,
      createdAt: now,
      updatedAt: now
    };
    this.couples.set(couple.id, couple);
    return this.withMembers(couple);
  }

  // --- helpers ---
  seed(couple: Omit<Couple, 'members'>): Couple {
    this.couples.set(couple.id, { ...couple });
    return this.withMembers(couple);
  }
}
