import type { HttpRequest } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { UnauthorizedError } from '../errors/AppError.js';

export function extractUserId(request: HttpRequest): string {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const { auth } = getServices();
  const payload = auth.verifyToken(token);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  return payload.userId;
}
