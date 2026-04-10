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
require('../../src/functions/getPhoto');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('getPhoto', () => {
  let userId: string;
  let coupleId: string;
  let photoId: string;

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

    const photo = await database.create('photo', {
      coupleId,
      uploadedByUserId: userId,
      blobUrl: 'https://teststorage.blob.core.windows.net/photos/photo1.jpg',
      caption: 'Our first date!',
    });
    photoId = (photo as { id: string }).id;
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 200 with photo details', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
      params: { id: photoId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.id).toBe(photoId);
    expect(result.jsonBody.caption).toBe('Our first date!');
    expect(result.jsonBody.coupleId).toBe(coupleId);
  });

  it('should return 404 for non-existent photo', async () => {
    const fakeId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
      params: { id: fakeId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(404);
    expect(result.jsonBody.error.code).toBe('NOT_FOUND');
  });
});
