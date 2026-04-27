import type { User } from '@app/shared';

export interface CreateUserInput {
  entraObjectId: string;
  email: string;
  displayName: string;
}

export interface IUserRepository {
  findByEntraObjectId(entraObjectId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  setCoupleId(userId: string, coupleId: string | null): Promise<User>;
  countByCoupleId(coupleId: string): Promise<number>;
  listByCoupleId(coupleId: string): Promise<User[]>;
  ping(): Promise<void>;
}
