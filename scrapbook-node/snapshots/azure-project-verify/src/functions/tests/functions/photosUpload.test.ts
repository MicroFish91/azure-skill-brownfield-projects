import { describe, it, expect, beforeEach } from 'vitest';
import type { ApiErrorResponse, PhotoResponse } from '@app/shared';
import { photosUploadHandler } from '../../src/functions/photosUpload.js';
import { coupleGetHandler } from '../../src/functions/coupleGet.js';
import { getServices } from '../../src/services/registry.js';
import {
  authedHeaders,
  buildPhotoFormData,
  createMockContext,
  createMockRequest
} from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

function asAlice() {
  const services = getServices() as MockServiceContainer;
  services.auth.setPrincipal('alice', {
    entraObjectId: 'oid-alice', email: 'alice@example.com', displayName: 'Alice'
  });
  return services;
}

async function pairAlice() {
  await coupleGetHandler(
    createMockRequest({ headers: authedHeaders('alice') }),
    createMockContext()
  );
}

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe('POST /api/photos', () => {
  beforeEach(() => asAlice());

  it('returns 401 without auth', async () => {
    const res = await photosUploadHandler(
      createMockRequest({ method: 'POST' }),
      createMockContext()
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when the caller is not paired', async () => {
    const fd = buildPhotoFormData(jpegBytes);
    const res = await photosUploadHandler(
      createMockRequest({
        method: 'POST',
        headers: { ...authedHeaders('alice'), 'content-type': 'multipart/form-data; boundary=x' },
        formData: async () => fd
      }),
      createMockContext()
    );
    expect(res.status).toBe(403);
    expect((res.jsonBody as ApiErrorResponse).error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when content-type is unsupported', async () => {
    await pairAlice();
    const res = await photosUploadHandler(
      createMockRequest({
        method: 'POST',
        headers: { ...authedHeaders('alice'), 'content-type': 'application/pdf' }
      }),
      createMockContext()
    );
    expect(res.status).toBe(400);
  });

  it('returns 422 when the upload exceeds the size limit', async () => {
    await pairAlice();
    const big = new Uint8Array(11 * 1024 * 1024);
    const fd = buildPhotoFormData(big);
    const res = await photosUploadHandler(
      createMockRequest({
        method: 'POST',
        headers: { ...authedHeaders('alice'), 'content-type': 'multipart/form-data; boundary=x' },
        formData: async () => fd
      }),
      createMockContext()
    );
    expect(res.status).toBe(422);
  });

  it('uploads via multipart and stores the photo with an AI caption', async () => {
    await pairAlice();
    const services = getServices() as MockServiceContainer;
    services.captions.captionToReturn = 'Lakeside picnic';

    const fd = buildPhotoFormData(jpegBytes);
    const res = await photosUploadHandler(
      createMockRequest({
        method: 'POST',
        headers: { ...authedHeaders('alice'), 'content-type': 'multipart/form-data; boundary=x' },
        formData: async () => fd
      }),
      createMockContext()
    );

    expect(res.status).toBe(201);
    const { photo } = res.jsonBody as PhotoResponse;
    expect(photo.caption).toBe('Lakeside picnic');
    expect(photo.captionSource).toBe('ai');
    expect(photo.url).toMatch(/^https:\/\/mock\.example\/blobs\//);
    expect(services.photos.photos.size).toBe(1);
    expect(services.blob.uploads.size).toBe(1);
  });

  it('uploads via raw image body when content-type is image/*', async () => {
    await pairAlice();
    const buf = jpegBytes.buffer.slice(0);
    const res = await photosUploadHandler(
      createMockRequest({
        method: 'POST',
        headers: { ...authedHeaders('alice'), 'content-type': 'image/jpeg' },
        arrayBuffer: async () => buf
      }),
      createMockContext()
    );
    expect(res.status).toBe(201);
  });

  it('Enhancement resilience: still saves with fallback caption when AI fails', async () => {
    await pairAlice();
    const services = getServices() as MockServiceContainer;
    services.captions.shouldFail = true;

    const fd = buildPhotoFormData(jpegBytes);
    const res = await photosUploadHandler(
      createMockRequest({
        method: 'POST',
        headers: { ...authedHeaders('alice'), 'content-type': 'multipart/form-data; boundary=x' },
        formData: async () => fd
      }),
      createMockContext()
    );

    expect(res.status).toBe(201);
    const { photo } = res.jsonBody as PhotoResponse;
    expect(photo.captionSource).toBe('fallback');
    expect(photo.caption).toBe('A new memory ✨');
  });
});
