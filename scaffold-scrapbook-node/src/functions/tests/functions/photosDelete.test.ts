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

await import('../../src/functions/photosDelete.js');

const PHOTO_UUID = '55555555-5555-5555-5555-555555555555';
const NONEXISTENT_UUID = '99999999-9999-9999-9999-999999999999';

beforeEach(async () => {
  const { database } = getServices();
  await database.create('photo', {
    id: PHOTO_UUID,
    coupleId: 'cpl-001',
    uploadedBy: 'usr-001',
    blobUrl: `https://mock.blob.core.windows.net/photos/cpl-001/${PHOTO_UUID}`,
    caption: 'Delete test photo',
    createdAt: '2026-01-15T10:30:00.000Z',
    updatedAt: '2026-01-15T10:30:00.000Z',
  });
});

describe('DELETE /api/photos/:id', () => {
  it('should return 200 on successful delete', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'DELETE',
      params: { id: PHOTO_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.photosDelete(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({ success: true });
  });

  it('should return 403 when photo belongs to different couple', async () => {
    const req = createAuthenticatedRequest('usr-003', {
      method: 'DELETE',
      params: { id: PHOTO_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.photosDelete(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(403);
  });

  it('should return 404 when photo not found', async () => {
    const req = createAuthenticatedRequest('usr-001', {
      method: 'DELETE',
      params: { id: NONEXISTENT_UUID },
    });
    const ctx = createMockContext();

    const res = await handlers.photosDelete(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(404);
  });
});
