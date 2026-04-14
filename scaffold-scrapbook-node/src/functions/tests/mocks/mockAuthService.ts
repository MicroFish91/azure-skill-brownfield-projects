import type { IAuthService } from '../../src/services/interfaces/IAuthService.js';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';

export class MockAuthService implements IAuthService {
  async hashPassword(_password: string): Promise<string> {
    return '$2a$10$mockhash';
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    if (hash === '$2a$10$mockhash') return true;
    return password === 'correct-password';
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, TEST_SECRET) as { userId: string };
      return { userId: decoded.userId };
    } catch {
      return null;
    }
  }
}
