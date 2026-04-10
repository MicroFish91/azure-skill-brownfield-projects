jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

import { app } from '@azure/functions';
import { setupTestServices, createMockRequest, createMockContext } from '../helpers/testUtils';
import { resetServices } from '../../src/services/registry';

const { database } = setupTestServices();
require('../../src/functions/register');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('register', () => {
  beforeEach(() => {
    database.clear();
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 201 with user and token on successful registration', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
      },
    });
    const context = createMockContext();

    const result = await handler(request, context);

    expect(result.status).toBe(201);
    expect(result.jsonBody.user).toBeDefined();
    expect(result.jsonBody.user.email).toBe('newuser@example.com');
    expect(result.jsonBody.user.displayName).toBe('New User');
    expect(result.jsonBody.user.passwordHash).toBeUndefined();
    expect(result.jsonBody.token).toBeDefined();
    expect(typeof result.jsonBody.token).toBe('string');
  });

  it('should return 409 for duplicate email', async () => {
    // Register first user
    const request1 = createMockRequest({
      method: 'POST',
      body: {
        email: 'duplicate@example.com',
        password: 'password123',
        displayName: 'First User',
      },
    });
    await handler(request1, createMockContext());

    // Try to register with same email
    const request2 = createMockRequest({
      method: 'POST',
      body: {
        email: 'duplicate@example.com',
        password: 'password456',
        displayName: 'Second User',
      },
    });
    const result = await handler(request2, createMockContext());

    expect(result.status).toBe(409);
    expect(result.jsonBody.error.code).toBe('CONFLICT');
  });

  it('should return 422 for invalid input', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        email: 'not-an-email',
        password: 'short',
      },
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(422);
    expect(result.jsonBody.error.code).toBe('VALIDATION_ERROR');
  });
});
