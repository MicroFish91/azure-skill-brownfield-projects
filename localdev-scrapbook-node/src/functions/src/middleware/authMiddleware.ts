import { HttpRequest } from '@azure/functions';
import jwt from 'jsonwebtoken';
import { getConfig } from '../services/config';
import { UnauthorizedError } from '../errors/errorTypes';

export interface AuthPayload {
  userId: string;
  email: string;
}

export function authenticateRequest(request: HttpRequest): AuthPayload {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedError('Invalid Authorization header format. Use: Bearer <token>');
  }

  const token = parts[1];
  const config = getConfig();

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    if (!decoded.userId || !decoded.email) {
      throw new UnauthorizedError('Invalid token payload');
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired token');
  }
}
