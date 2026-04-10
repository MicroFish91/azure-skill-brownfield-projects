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
require('../../src/functions/acceptInvite');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('acceptInvite', () => {
  let senderId: string;
  let receiverId: string;
  let inviteId: string;

  beforeEach(async () => {
    database.clear();

    const sender = await database.create('user', {
      email: 'alice@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Alice',
      coupleId: null,
    });
    senderId = (sender as { id: string }).id;

    const receiver = await database.create('user', {
      email: 'bob@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Bob',
      coupleId: null,
    });
    receiverId = (receiver as { id: string }).id;

    const invite = await database.create('invite', {
      fromUserId: senderId,
      toEmail: 'bob@example.com',
      status: 'pending',
    });
    inviteId = (invite as { id: string }).id;
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 200 and create couple on successful accept', async () => {
    const headers = createAuthHeaders(receiverId, 'bob@example.com');
    const request = createMockRequest({
      method: 'POST',
      headers,
      params: { id: inviteId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.invite).toBeDefined();
    expect(result.jsonBody.invite.status).toBe('accepted');
    expect(result.jsonBody.couple).toBeDefined();
    expect(result.jsonBody.couple.id).toBeDefined();
  });

  it('should return 404 for non-existent invite', async () => {
    const headers = createAuthHeaders(receiverId, 'bob@example.com');
    const fakeId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const request = createMockRequest({
      method: 'POST',
      headers,
      params: { id: fakeId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(404);
    expect(result.jsonBody.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when not authenticated', async () => {
    const request = createMockRequest({
      method: 'POST',
      params: { id: inviteId },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(401);
  });
});
