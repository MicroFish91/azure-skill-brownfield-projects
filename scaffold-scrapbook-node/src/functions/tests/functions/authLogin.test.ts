import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import { createMockRequest, createMockContext } from '../helpers.js';
import { getServices } from '../../src/services/registry.js';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/authLogin.js');

describe('POST /api/auth/login', () => {
  it('should return 200 with token on valid login', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'alice@example.com',
        password: 'anypassword',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authLogin(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toHaveProperty('token');
    expect(res.jsonBody).toHaveProperty('user');
    const body = res.jsonBody as { user: { email: string } };
    expect(body.user.email).toBe('alice@example.com');
  });

  it('should return 401 on wrong password', async () => {
    const services = getServices();
    vi.spyOn(services.auth, 'comparePassword').mockResolvedValueOnce(false);

    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'alice@example.com',
        password: 'wrongpassword',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authLogin(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(401);
  });

  it('should return 401 on non-existent email', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authLogin(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(401);
  });

  it('should return 422 on invalid input', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'not-an-email',
        password: 'anypassword',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authLogin(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(422);
  });
});
