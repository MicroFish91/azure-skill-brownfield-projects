import { describe, it, expect, vi, beforeEach } from 'vitest';
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

await import('../../src/functions/couplesAccept.js');

const PENDING_COUPLE_UUID = '22222222-2222-2222-2222-222222222222';
const ACCEPTED_COUPLE_UUID = '33333333-3333-3333-3333-333333333333';

beforeEach(async () => {
  const { database } = getServices();

  await database.create('couple', {
    id: PENDING_COUPLE_UUID,
    user1Id: 'usr-003',
    user2Id: 'usr-004',
    status: 'pending',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  });

  await database.create('couple', {
    id: ACCEPTED_COUPLE_UUID,
    user1Id: 'usr-001',
    user2Id: 'usr-002',
    status: 'accepted',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });

  await database.create('user', {
    id: 'usr-004',
    email: 'diana@example.com',
    passwordHash: '$2a$10$mockhash',
    displayName: 'Diana',
    coupleId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
});

describe('POST /api/couples/:id/accept', () => {
  it('should return 200 when invited partner accepts', async () => {
    const req = createAuthenticatedRequest('usr-004', {
      method: 'POST',
      params: { id: PENDING_COUPLE_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesAccept(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toHaveProperty('couple');
    const body = res.jsonBody as { couple: { status: string } };
    expect(body.couple.status).toBe('accepted');
  });

  it('should return 403 when non-invited user tries to accept', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'POST',
      params: { id: PENDING_COUPLE_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesAccept(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(403);
  });

  it('should return 409 when already accepted', async () => {
    const req = createAuthenticatedRequest('usr-002', {
      method: 'POST',
      params: { id: ACCEPTED_COUPLE_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesAccept(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(409);
  });
});
