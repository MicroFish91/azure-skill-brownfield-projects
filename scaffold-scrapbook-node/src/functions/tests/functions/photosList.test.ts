import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import { createAuthenticatedRequest, createMockContext } from '../helpers.js';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/photosList.js');

describe('GET /api/photos', () => {
  it('should return 200 with photos when user is in a couple', async () => {
    const req = createAuthenticatedRequest('usr-001', { method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.photosList(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toHaveProperty('photos');
    expect(res.jsonBody).toHaveProperty('total');
    const body = res.jsonBody as { photos: { coupleId: string }[]; total: number };
    expect(body.photos).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.photos[0].coupleId).toBe('cpl-001');
  });

  it('should return 403 when user not in a couple', async () => {
    const req = createAuthenticatedRequest('usr-003', { method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.photosList(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(403);
  });
});
