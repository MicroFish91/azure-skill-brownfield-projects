import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import { createAuthenticatedRequest, createMockContext } from '../helpers.js';
import { registerServices, clearServices } from '../../src/services/registry.js';
import { MockDatabaseService } from '../mocks/mockDatabaseService.js';
import { MockStorageService } from '../mocks/mockStorageService.js';
import { MockCaptionService } from '../mocks/mockCaptionService.js';
import { MockAuthService } from '../mocks/mockAuthService.js';
import userFixtures from '../fixtures/users.json';
import coupleFixtures from '../fixtures/couples.json';
import photoFixtures from '../fixtures/photos.json';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/photosUpload.js');

function createMockFormData(): FormData {
  const mockFile = new Blob(['fake-image'], { type: 'image/jpeg' });
  Object.defineProperty(mockFile, 'size', { value: 1024 });
  const formData = new FormData();
  formData.set('file', mockFile, 'test.jpg');
  return formData;
}

describe('POST /api/photos', () => {
  it('should return 201 with photo and caption on valid upload', async () => {
    const formData = createMockFormData();
    const req = createAuthenticatedRequest('usr-001', {
      method: 'POST',
      formData,
    });
    const ctx = createMockContext();

    const res = await handlers.photosUpload(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(201);
    expect(res.jsonBody).toHaveProperty('photo');
    const body = res.jsonBody as { photo: { coupleId: string; uploadedBy: string; caption: string } };
    expect(body.photo.coupleId).toBe('cpl-001');
    expect(body.photo.uploadedBy).toBe('usr-001');
    expect(body.photo.caption).toBe('A beautiful moment captured!');
  });

  it('should return 201 with empty caption when caption service fails', async () => {
    clearServices();
    registerServices({
      database: new MockDatabaseService({
        user: userFixtures.validUsers,
        couple: coupleFixtures.validCouples,
        photo: photoFixtures.validPhotos,
      }),
      storage: new MockStorageService(),
      caption: new MockCaptionService({ shouldFail: true }),
      auth: new MockAuthService(),
    });

    const formData = createMockFormData();
    const req = createAuthenticatedRequest('usr-001', {
      method: 'POST',
      formData,
    });
    const ctx = createMockContext();

    const res = await handlers.photosUpload(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(201);
    expect(res.jsonBody).toHaveProperty('photo');
    const body = res.jsonBody as { photo: { caption: string } };
    expect(body.photo.caption).toBe('');
  });

  it('should return 403 when user not in a couple', async () => {
    const formData = createMockFormData();
    const req = createAuthenticatedRequest('usr-003', {
      method: 'POST',
      formData,
    });
    const ctx = createMockContext();

    const res = await handlers.photosUpload(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(403);
  });

  it('should return 422 when no file provided', async () => {
    const emptyFormData = new FormData();
    const req = createAuthenticatedRequest('usr-001', {
      method: 'POST',
      formData: emptyFormData,
    });
    const ctx = createMockContext();

    const res = await handlers.photosUpload(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(422);
  });
});
