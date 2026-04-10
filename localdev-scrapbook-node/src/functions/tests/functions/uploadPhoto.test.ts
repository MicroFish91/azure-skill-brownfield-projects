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

const { database, aiCaption } = setupTestServices();
require('../../src/functions/uploadPhoto');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

function createFormDataRequest(
  headers: Record<string, string>,
  file: { buffer: Buffer; type: string; name: string },
  caption?: string
) {
  const formDataMap = new Map<string, unknown>();
  // Use Uint8Array to avoid Buffer/BlobPart TS incompatibility
  const uint8 = new Uint8Array(file.buffer);
  const fileBlob = new Blob([uint8], { type: file.type });
  // Attach .type as a File-like property (Blob already has .type)
  formDataMap.set('file', fileBlob);
  if (caption !== undefined) {
    formDataMap.set('caption', caption);
  }

  const headerMap = new Map<string, string>();
  for (const [key, value] of Object.entries(headers)) {
    headerMap.set(key.toLowerCase(), value);
  }

  return {
    method: 'POST',
    url: 'http://localhost:7071/api/photos',
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) || null,
      has: (name: string) => headerMap.has(name.toLowerCase()),
      entries: () => headerMap.entries(),
      forEach: (cb: (value: string, key: string) => void) => headerMap.forEach(cb),
      keys: () => headerMap.keys(),
      values: () => headerMap.values(),
      [Symbol.iterator]: () => headerMap[Symbol.iterator](),
    },
    query: {
      get: () => null,
      has: () => false,
      entries: () => new Map().entries(),
      forEach: () => {},
      keys: () => new Map().keys(),
      values: () => new Map().values(),
      [Symbol.iterator]: () => new Map()[Symbol.iterator](),
    },
    params: {},
    formData: async () => ({
      get: (key: string) => {
        const val = formDataMap.get(key);
        if (val === undefined) return null;
        if (typeof val === 'string') return val;
        return val;
      },
      has: (key: string) => formDataMap.has(key),
    }),
    json: async () => null,
    text: async () => '',
    body: null,
    bodyUsed: false,
    user: null,
  };
}

describe('uploadPhoto', () => {
  let userId: string;
  let coupleId: string;

  beforeEach(async () => {
    database.clear();
    aiCaption.shouldFail = false;

    const couple = await database.create('couple', {});
    coupleId = (couple as { id: string }).id;

    const user = await database.create('user', {
      email: 'alice@example.com',
      passwordHash: 'hashedpassword',
      displayName: 'Alice',
      coupleId,
    });
    userId = (user as { id: string }).id;
  });

  afterAll(() => {
    resetServices();
  });

  it('should return 201 on successful upload', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const fakeImage = Buffer.from('fake-image-data');
    const request = createFormDataRequest(
      headers,
      { buffer: fakeImage, type: 'image/jpeg', name: 'photo.jpg' },
      'Our first date!'
    );

    const result = await handler(request, createMockContext());

    expect(result.status).toBe(201);
    expect(result.jsonBody.coupleId).toBe(coupleId);
    expect(result.jsonBody.uploadedByUserId).toBe(userId);
    expect(result.jsonBody.caption).toBe('Our first date!');
    expect(result.jsonBody.blobUrl).toBeDefined();
  });

  it('should return 201 with default caption when AI fails (graceful degradation)', async () => {
    aiCaption.shouldFail = true;

    const headers = createAuthHeaders(userId, 'alice@example.com');
    const fakeImage = Buffer.from('fake-image-data');
    const request = createFormDataRequest(
      headers,
      { buffer: fakeImage, type: 'image/jpeg', name: 'photo.jpg' }
    );

    const result = await handler(request, createMockContext());

    expect(result.status).toBe(201);
    expect(result.jsonBody.caption).toBe('A special moment 📸');
  });

  it('should use AI-generated caption when no caption provided and AI works', async () => {
    const headers = createAuthHeaders(userId, 'alice@example.com');
    const fakeImage = Buffer.from('fake-image-data');
    const request = createFormDataRequest(
      headers,
      { buffer: fakeImage, type: 'image/jpeg', name: 'photo.jpg' }
    );

    const result = await handler(request, createMockContext());

    expect(result.status).toBe(201);
    expect(result.jsonBody.caption).toBe('A lovely couple photo together 💕');
  });
});
