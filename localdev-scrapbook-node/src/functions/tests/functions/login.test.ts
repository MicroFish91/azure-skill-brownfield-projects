jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

import { app } from '@azure/functions';
import bcrypt from 'bcryptjs';
import { setupTestServices, createMockRequest, createMockContext } from '../helpers/testUtils';
import { resetServices } from '../../src/services/registry';

const { database } = setupTestServices();
require('../../src/functions/login');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('login', () => {
  beforeEach(async () => {
    database.clear();
    const passwordHash = await bcrypt.hash('password123', 10);
    await database.create('user', {
      email: 'alice@example.com',
      passwordHash,
      displayName: 'Alice',
      coupleId: null,
    });
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 200 with user and token on successful login', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'alice@example.com',
        password: 'password123',
      },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.user).toBeDefined();
    expect(result.jsonBody.user.email).toBe('alice@example.com');
    expect(result.jsonBody.user.passwordHash).toBeUndefined();
    expect(result.jsonBody.token).toBeDefined();
    expect(typeof result.jsonBody.token).toBe('string');
  });

  it('should return 401 for wrong password', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'alice@example.com',
        password: 'wrongpassword',
      },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(401);
    expect(result.jsonBody.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 for non-existent user', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'nobody@example.com',
        password: 'password123',
      },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(401);
    expect(result.jsonBody.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 422 for invalid input', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'not-valid',
      },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(422);
    expect(result.jsonBody.error.code).toBe('VALIDATION_ERROR');
  });
});
