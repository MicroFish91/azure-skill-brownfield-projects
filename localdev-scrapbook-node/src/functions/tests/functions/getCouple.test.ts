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
require('../../src/functions/getCouple');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('getCouple', () => {
  let aliceId: string;
  let bobId: string;
  let coupleId: string;

  beforeEach(async () => {
    database.clear();

    const couple = await database.create('couple', {});
    coupleId = (couple as { id: string }).id;

    const alice = await database.create('user', {
      email: 'alice@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Alice',
      coupleId,
    });
    aliceId = (alice as { id: string }).id;

    const bob = await database.create('user', {
      email: 'bob@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Bob',
      coupleId,
    });
    bobId = (bob as { id: string }).id;
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 200 with couple info when coupled', async () => {
    const headers = createAuthHeaders(aliceId, 'alice@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.couple).toBeDefined();
    expect(result.jsonBody.couple.id).toBe(coupleId);
    expect(result.jsonBody.couple.partner).toBeDefined();
    expect(result.jsonBody.couple.partner.email).toBe('bob@example.com');
    expect(result.jsonBody.couple.partner.displayName).toBe('Bob');
  });

  it('should return 404 when user is not in a couple', async () => {
    const single = await database.create('user', {
      email: 'carol@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Carol',
      coupleId: null,
    });
    const singleId = (single as { id: string }).id;

    const headers = createAuthHeaders(singleId, 'carol@example.com');
    const request = createMockRequest({
      method: 'GET',
      headers,
    });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(404);
    expect(result.jsonBody.error.code).toBe('NOT_FOUND');
  });
});
