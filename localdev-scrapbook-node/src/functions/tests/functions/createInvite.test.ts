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
require('../../src/functions/createInvite');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('createInvite', () => {
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
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 201 on successful invite creation', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'POST',
      headers,
      body: { toEmail: 'bob@example.com' },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(201);
    expect(result.jsonBody.toEmail).toBe('bob@example.com');
    expect(result.jsonBody.fromUserId).toBe(userId);
    expect(result.jsonBody.status).toBe('pending');
  });

  it('should return 400 for self-invite', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'POST',
      headers,
      body: { toEmail: 'alice@example.com' },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(400);
    expect(result.jsonBody.error.code).toBe('BAD_REQUEST');
  });

  it('should return 409 for duplicate pending invite', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');

    // Create first invite
    const request1 = createMockRequest({
      method: 'POST',
      headers,
      body: { toEmail: 'bob@example.com' },
    });
    await handler(request1, createMockContext());

    // Try to create duplicate
    const request2 = createMockRequest({
      method: 'POST',
      headers,
      body: { toEmail: 'bob@example.com' },
    });
    const result = await handler(request2, createMockContext());

    expect(result.status).toBe(409);
    expect(result.jsonBody.error.code).toBe('CONFLICT');
  });

  it('should return 409 when user is already in a couple', async () => {
    // Update user to have a coupleId
    await database.update('user', userId, { coupleId: 'some-couple-id' });

    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'POST',
      headers,
      body: { toEmail: 'bob@example.com' },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(409);
    expect(result.jsonBody.error.code).toBe('CONFLICT');
  });
});
