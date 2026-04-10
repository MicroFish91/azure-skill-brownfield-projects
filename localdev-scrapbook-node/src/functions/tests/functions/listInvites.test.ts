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
require('../../src/functions/listInvites');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('listInvites', () => {
  let userId: string;

  beforeEach(async () => {
    database.clear();
    const user = await database.create('user', {
      email: 'alice@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Alice',
      coupleId: null,
    });
    userId = (user as { id: string }).id;

    // Create some invites sent by Alice
    await database.create('invite', {
      fromUserId: userId,
      toEmail: 'bob@example.com',
      status: 'pending',
    });

    await database.create('invite', {
      fromUserId: userId,
      toEmail: 'carol@example.com',
      status: 'pending',
    });

    // Create an invite to Alice from someone else
    await database.create('invite', {
      fromUserId: 'other-user-id',
      toEmail: 'alice@example.com',
      status: 'pending',
    });
  });

  afterAll(() => {
    resetServices();
  });

  it('should return received invites for authenticated user (default)', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.invites).toBeDefined();
    expect(Array.isArray(result.jsonBody.invites)).toBe(true);
    // Should return invites where toEmail is alice's email
    expect(result.jsonBody.invites.length).toBe(1);
    expect(result.jsonBody.invites[0].toEmail).toBe('alice@example.com');
  });

  it('should return sent invites when type=sent', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
      query: { type: 'sent' },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.invites.length).toBe(2);
    result.jsonBody.invites.forEach((invite: { fromUserId: string }) => {
      expect(invite.fromUserId).toBe(userId);
    });
  });
});
