import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import { createMockRequest, createMockContext } from '../helpers.js';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/authRegister.js');

describe('POST /api/auth/register', () => {
  it('should return 201 with token and user on valid registration', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'newuser@example.com',
        password: 'securepass123',
        displayName: 'New User',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authRegister(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(201);
    expect(res.jsonBody).toHaveProperty('token');
    expect(res.jsonBody).toHaveProperty('user');
    const body = res.jsonBody as { user: { email: string; displayName: string } };
    expect(body.user.email).toBe('newuser@example.com');
    expect(body.user.displayName).toBe('New User');
  });

  it('should return 409 when email already exists', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'alice@example.com',
        password: 'securepass123',
        displayName: 'Alice Duplicate',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authRegister(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(409);
  });

  it('should return 422 on invalid input (missing email)', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        password: 'securepass123',
        displayName: 'No Email',
      },
    });
    const ctx = createMockContext();

    const res = await handlers.authRegister(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(422);
  });
});
