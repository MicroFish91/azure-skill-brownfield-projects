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
require('../../src/functions/getMe');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('getMe', () => {
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

  it('should return 200 with user profile when authenticated', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.email).toBe('alice@example.com');
    expect(result.jsonBody.displayName).toBe('Alice');
    expect(result.jsonBody.id).toBe(userId);
    expect(result.jsonBody.passwordHash).toBeUndefined();
  });

  it('should return 401 when no auth header', async () => {
    const request = createMockRequest({
      method: 'GET',
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(401);
    expect(result.jsonBody.error.code).toBe('UNAUTHORIZED');
  });
});
