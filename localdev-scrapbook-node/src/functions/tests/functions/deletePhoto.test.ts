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
require('../../src/functions/deletePhoto');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('deletePhoto', () => {
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

  it('should return 200 on successful delete', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'DELETE',
      headers,
      params: { id: photoId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.success).toBe(true);

    // Verify photo is actually deleted
    const deleted = await database.findById('photo', photoId);
    expect(deleted).toBeNull();
  });

  it('should return 404 for non-existent photo', async () => {
    const fakeId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'DELETE',
      headers,
      params: { id: fakeId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(404);
    expect(result.jsonBody.error.code).toBe('NOT_FOUND');
  });

  it('should return 403 when trying to delete another user\'s photo', async () => {
    // Create another user
    const other = await database.create('user', {
      email: 'bob@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Bob',
      coupleId,
    });
    const otherId = (other as { id: string }).id;

    const headers = createAuthHeaders(otherId, 'bob@example.com');
    const request = createMockRequest({
      method: 'DELETE',
      headers,
      params: { id: photoId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(403);
    expect(result.jsonBody.error.code).toBe('FORBIDDEN');
  });
});
