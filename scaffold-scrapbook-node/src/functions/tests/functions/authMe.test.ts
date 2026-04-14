import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import {
  createMockRequest,
  createAuthenticatedRequest,
  createMockContext,
} from '../helpers.js';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/authMe.js');

describe('GET /api/auth/me', () => {
  it('should return 200 with user when authenticated', async () => {
    const req = createAuthenticatedRequest('usr-001', { method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.authMe(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toHaveProperty('user');
    const body = res.jsonBody as { user: { id: string; email: string } };
    expect(body.user.id).toBe('usr-001');
    expect(body.user.email).toBe('alice@example.com');
  });

  it('should return 401 when no auth header', async () => {
    const req = createMockRequest({ method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.authMe(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(401);
  });

  it('should return 401 when invalid token', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: { authorization: 'Bearer invalid-token-value' },
    });
    const ctx = createMockContext();

    const res = await handlers.authMe(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(401);
  });
});
