import { describe, it, expect, beforeEach } from 'vitest';
import type { ApiErrorResponse, PhotoListResponse } from '@app/shared';
import { photosListHandler } from '../../src/functions/photosList.js';
import { coupleGetHandler } from '../../src/functions/coupleGet.js';
import { getServices } from '../../src/services/registry.js';
import { authedHeaders, createMockContext, createMockRequest } from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

function asAlice() {
  const services = getServices() as MockServiceContainer;
  services.auth.setPrincipal('alice', {
    entraObjectId: 'oid-alice', email: 'alice@example.com', displayName: 'Alice'
  });
  return services;
}

describe('GET /api/photos', () => {
  beforeEach(() => asAlice());

  it('returns 401 without auth', async () => {
    const res = await photosListHandler(createMockRequest(), createMockContext());
    expect(res.status).toBe(401);
  });

  it('returns 403 when the caller is not paired', async () => {
    const res = await photosListHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    expect(res.status).toBe(403);
    expect((res.jsonBody as ApiErrorResponse).error.code).toBe('FORBIDDEN');
  });

  it('returns 200 with an empty list when no photos exist', async () => {
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    const res = await photosListHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as PhotoListResponse).photos).toEqual([]);
  });

  it('returns 200 with the couple\'s photos newest-first, each with a signed URL', async () => {
    await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    const services = getServices() as MockServiceContainer;
    const alice = [...services.users.users.values()][0];
    const coupleId = alice.coupleId!;

    await services.photos.create({
      coupleId, uploaderId: alice.id, blobPath: 'a', contentType: 'image/jpeg',
      caption: 'one', captionSource: 'ai'
    });
    await new Promise((r) => setTimeout(r, 5));
    await services.photos.create({
      coupleId, uploaderId: alice.id, blobPath: 'b', contentType: 'image/jpeg',
      caption: 'two', captionSource: 'ai'
    });

    const res = await photosListHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    expect(res.status).toBe(200);
    const body = res.jsonBody as PhotoListResponse;
    expect(body.photos).toHaveLength(2);
    expect(body.photos[0].caption).toBe('two');
    expect(body.photos[1].caption).toBe('one');
    expect(body.photos[0].url).toContain('mock.example');
  });
});
