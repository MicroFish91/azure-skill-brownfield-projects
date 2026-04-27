import type { Couple } from '@app/shared';

export interface ICoupleRepository {
  findById(id: string): Promise<Couple | null>;
  findByInviteCode(inviteCode: string): Promise<Couple | null>;
  create(): Promise<Couple>;
}
