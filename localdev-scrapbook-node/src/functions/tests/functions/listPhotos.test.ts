jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

import { app } from '@azure/functions';
import {
  setupTestServices,
  createMockRequest,
  createMockContext,
  createAuthHeaders,
} from '../helpers/testUtils';
import { resetServices } from '../../src/services/registry';

const { database } = setupTestServices();
require('../../src/functions/listPhotos');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('listPhotos', () => {
  let userId: string;
  let coupleId: string;

  beforeEach(async () => {
    database.clear();

    const couple = await database.create('couple', {});
    coupleId = (couple as { id: string }).id;

    const user = await database.create('user', {
      email: 'alice@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Alice',
      coupleId,
    });
    userId = (user as { id: string }).id;

    // Create some photos
    await database.create('photo', {
      coupleId,
      uploadedByUserId: userId,
      blobUrl: 'https://teststorage.blob.core.windows.net/photos/photo1.jpg',
      caption: 'Photo 1',
    });

    await database.create('photo', {
      coupleId,
      uploadedByUserId: userId,
      blobUrl: 'https://teststorage.blob.core.windows.net/photos/photo2.jpg',
      caption: 'Photo 2',
    });
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 200 with photos for couple', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.photos).toBeDefined();
    expect(Array.isArray(result.jsonBody.photos)).toBe(true);
    expect(result.jsonBody.photos.length).toBe(2);
    expect(result.jsonBody.total).toBe(2);
  });

  it('should support pagination with limit and offset', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
      query: { limit: '1', offset: '0' },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.photos.length).toBe(1);
    expect(result.jsonBody.total).toBe(2);
  });
});
