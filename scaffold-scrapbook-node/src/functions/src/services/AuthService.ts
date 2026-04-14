import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { IAuthService } from './interfaces/IAuthService.js';

export class AuthService implements IAuthService {
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: '24h' });
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      return { userId: decoded.userId };
    } catch {
      return null;
    }
  }
}
