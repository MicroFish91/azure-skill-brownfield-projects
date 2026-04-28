import { randomUUID } from 'node:crypto';
import type { User } from '@app/shared';
import type { CreateUserInput, IUserRepository } from '../../src/services/interfaces/IUserRepository.js';

export class MockUserRepository implements IUserRepository {
  public users = new Map<string, User>();

  async findByEntraObjectId(entraObjectId: string): Promise<User | null> {
    for (const u of this.users.values()) if (u.entraObjectId === entraObjectId) return { ...u };
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    for (const u of this.users.values()) {
      if (u.entraObjectId === input.entraObjectId) {
        throw new Error('duplicate entra_object_id');
      }
      if (u.email === input.email) throw new Error('duplicate email');
    }
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      entraObjectId: input.entraObjectId,
      email: input.email,
      displayName: input.displayName,
      coupleId: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(user.id, user);
    return { ...user };
  }

  async setCoupleId(userId: string, coupleId: string | null): Promise<User> {
    const u = this.users.get(userId);
    if (!u) throw new Error('user not found');
    const updated: User = { ...u, coupleId, updatedAt: new Date().toISOString() };
    this.users.set(userId, updated);
    return { ...updated };
  }

  async countByCoupleId(coupleId: string): Promise<number> {
    let n = 0;
    for (const u of this.users.values()) if (u.coupleId === coupleId) n++;
    return n;
  }

  async listByCoupleId(coupleId: string): Promise<User[]> {
    return [...this.users.values()].filter((u) => u.coupleId === coupleId).map((u) => ({ ...u }));
  }

  async ping(): Promise<void> { /* always healthy */ }

  // --- helpers for tests ---
  seed(user: User): User {
    this.users.set(user.id, { ...user });
    return { ...user };
  }
}
