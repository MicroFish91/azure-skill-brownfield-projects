import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import { createAuthenticatedRequest, createMockContext } from '../helpers.js';
import { getServices } from '../../src/services/registry.js';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/couplesCreate.js');

describe('POST /api/couples', () => {
  it('should return 201 when creating couple invitation', async () => {
    const { database } = getServices();
    await database.create('user', {
      id: 'usr-004',
      email: 'diana@example.com',
      passwordHash: '$2a$10$mockhash',
      displayName: 'Diana',
      coupleId: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const req = createAuthenticatedRequest('usr-003', {
      method: 'POST',
      body: { partnerEmail: 'diana@example.com' },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesCreate(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(201);
    expect(res.jsonBody).toHaveProperty('couple');
    const body = res.jsonBody as { couple: { user1Id: string; user2Id: string; status: string } };
    expect(body.couple.user1Id).toBe('usr-003');
    expect(body.couple.user2Id).toBe('usr-004');
    expect(body.couple.status).toBe('pending');
  });

  it('should return 404 when partner email not found', async () => {
    const req = createAuthenticatedRequest('usr-003', {
      method: 'POST',
      body: { partnerEmail: 'nonexistent@example.com' },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesCreate(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(404);
  });

  it('should return 409 when already in a couple', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'POST',
      body: { partnerEmail: 'charlie@example.com' },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesCreate(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(409);
  });

  it('should return 409 when partner already in a couple', async () => {
    const req = createAuthenticatedRequest('usr-003', {
      method: 'POST',
      body: { partnerEmail: 'alice@example.com' },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesCreate(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(409);
  });
});
