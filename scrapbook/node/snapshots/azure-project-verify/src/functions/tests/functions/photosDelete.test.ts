import { describe, it, expect, beforeEach } from 'vitest';
import type { ApiErrorResponse } from '@app/shared';
import { photosDeleteHandler } from '../../src/functions/photosDelete.js';
import { coupleGetHandler } from '../../src/functions/coupleGet.js';
import { getServices } from '../../src/services/registry.js';
import { authedHeaders, createMockContext, createMockRequest } from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

function setupUsers() {
  const services = getServices() as MockServiceContainer;
  services.auth.setPrincipal('alice', {
    entraObjectId: 'oid-alice', email: 'alice@example.com', displayName: 'Alice'
  });
  services.auth.setPrincipal('outsider', {
    entraObjectId: 'oid-outsider', email: 'out@example.com', displayName: 'Outsider'
  });
  return services;
}

describe('DELETE /api/photos/{id}', () => {
  beforeEach(() => setupUsers());

  it('returns 401 without auth', async () => {
    const res = await photosDeleteHandler(
      createMockRequest({ method: 'DELETE', params: { id: '11111111-1111-1111-1111-111111111111' } }),
      createMockContext()
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when the caller is not paired', async () => {
    const res = await photosDeleteHandler(
      createMockRequest({
        method: 'DELETE',
        headers: authedHeaders('alice'),
        params: { id: '11111111-1111-1111-1111-111111111111' }
      }),
      createMockContext()
    );
    expect(res.status).toBe(403);
  });

  it('returns 422 when the path id is not a UUID', async () => {
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    const res = await photosDeleteHandler(
      createMockRequest({
        method: 'DELETE',
        headers: authedHeaders('alice'),
        params: { id: 'not-a-uuid' }
      }),
      createMockContext()
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when the photo does not exist', async () => {
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    const res = await photosDeleteHandler(
      createMockRequest({
        method: 'DELETE',
        headers: authedHeaders('alice'),
        params: { id: '00000000-0000-0000-0000-000000000000' }
      }),
      createMockContext()
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when the photo belongs to another couple', async () => {
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('outsider') }),
      createMockContext()
    );
    const services = getServices() as MockServiceContainer;
    const outsider = [...services.users.users.values()].find((u) => u.email === 'out@example.com')!;
    const foreign = await services.photos.create({
      coupleId: outsider.coupleId!, uploaderId: outsider.id,
      blobPath: 'foreign', contentType: 'image/jpeg', caption: 'x', captionSource: 'ai'
    });

    const res = await photosDeleteHandler(
      createMockRequest({
        method: 'DELETE',
        headers: authedHeaders('alice'),
        params: { id: foreign.id }
      }),
      createMockContext()
    );
    expect(res.status).toBe(403);
  });

  it('returns 204 and removes the blob + row when the caller owns the photo', async () => {
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    const services = getServices() as MockServiceContainer;
    const alice = [...services.users.users.values()][0];
    const photo = await services.photos.create({
      coupleId: alice.coupleId!, uploaderId: alice.id,
      blobPath: 'mine', contentType: 'image/jpeg', caption: 'x', captionSource: 'ai'
    });
    services.blob.uploads.set('mine', { data: Buffer.from(''), contentType: 'image/jpeg' });

    const res = await photosDeleteHandler(
      createMockRequest({
        method: 'DELETE',
        headers: authedHeaders('alice'),
        params: { id: photo.id }
      }),
      createMockContext()
    );
    expect(res.status).toBe(204);
    expect(services.photos.photos.has(photo.id)).toBe(false);
    expect(services.blob.deleted).toContain('mine');
  });
});
