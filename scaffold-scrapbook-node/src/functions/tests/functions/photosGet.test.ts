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

await import('../../src/functions/photosGet.js');

const PHOTO_UUID = '44444444-4444-4444-4444-444444444444';
const NONEXISTENT_UUID = '99999999-9999-9999-9999-999999999999';

beforeEach(async () => {
  const { database } = getServices();
  await database.create('photo', {
    id: PHOTO_UUID,
    coupleId: 'cpl-001',
    uploadedBy: 'usr-001',
    blobUrl: `https://mock.blob.core.windows.net/photos/cpl-001/${PHOTO_UUID}`,
    caption: 'Test photo',
    createdAt: '2026-01-15T10:30:00.000Z',
    updatedAt: '2026-01-15T10:30:00.000Z',
  });
});

describe('GET /api/photos/:id', () => {
  it('should return 200 with photo when authorized', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'GET',
      params: { id: PHOTO_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.photosGet(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toHaveProperty('photo');
    const body = res.jsonBody as { photo: { id: string; coupleId: string } };
    expect(body.photo.id).toBe(PHOTO_UUID);
    expect(body.photo.coupleId).toBe('cpl-001');
  });

  it('should return 403 when photo belongs to different couple', async () => {
    const req = createAuthenticatedRequest('usr-003', {
      method: 'GET',
      params: { id: PHOTO_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.photosGet(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(403);
  });

  it('should return 404 when photo not found', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'GET',
      params: { id: NONEXISTENT_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.photosGet(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(404);
  });
});
