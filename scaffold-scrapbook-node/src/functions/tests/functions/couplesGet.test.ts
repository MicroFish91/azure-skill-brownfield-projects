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

await import('../../src/functions/couplesGet.js');

const COUPLE_UUID = '11111111-1111-1111-1111-111111111111';
const NONEXISTENT_UUID = '99999999-9999-9999-9999-999999999999';

beforeEach(async () => {
  const { database } = getServices();
  await database.create('couple', {
    id: COUPLE_UUID,
    user1Id: 'usr-001',
    user2Id: 'usr-002',
    status: 'accepted',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });
});

describe('GET /api/couples/:id', () => {
  it('should return 200 with couple details when member', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'GET',
      params: { id: COUPLE_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesGet(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toHaveProperty('couple');
    expect(res.jsonBody).toHaveProperty('users');
    const body = res.jsonBody as { couple: { id: string }; users: { id: string }[] };
    expect(body.couple.id).toBe(COUPLE_UUID);
    expect(body.users).toHaveLength(2);
  });

  it('should return 403 when not a member', async () => {
    const req = createAuthenticatedRequest('usr-003', {
      method: 'GET',
      params: { id: COUPLE_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesGet(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(403);
  });

  it('should return 404 when couple not found', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'GET',
      params: { id: NONEXISTENT_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.couplesGet(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(404);
  });
});
