import { HttpRequest, InvocationContext } from '@azure/functions';
import jwt from 'jsonwebtoken';
import { MockDatabaseService } from '../mocks/MockDatabaseService';
import { MockStorageService } from '../mocks/MockStorageService';
import { MockAICaptionService } from '../mocks/MockAICaptionService';
import { registerServices } from '../../src/services/registry';

export function createAuthHeaders(userId: string, email: string): Record<string, string> {
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || 'test-secret-key-for-testing-only');
  return {
    authorization: `Bearer ${token}`,
  };
}

export interface MockRequestOptions {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export function createMockRequest(options: MockRequestOptions = {}): HttpRequest {
  const {
    method = 'GET',
    url = 'http://localhost:7071/api/test',
    body = null,
    headers = {},
    params = {},
    query = {},
  } = options;

  const headerMap = new Map<string, string>();
  for (const [key, value] of Object.entries(headers)) {
    headerMap.set(key.toLowerCase(), value);
  }

  const queryMap = new Map<string, string>();
  for (const [key, value] of Object.entries(query)) {
    queryMap.set(key, value);
  }

  const bodyString = body ? JSON.stringify(body) : '';

  return {
    method,
    url,
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) || null,
      has: (name: string) => headerMap.has(name.toLowerCase()),
      entries: () => headerMap.entries(),
      forEach: (cb: (value: string, key: string) => void) => headerMap.forEach(cb),
      keys: () => headerMap.keys(),
      values: () => headerMap.values(),
      [Symbol.iterator]: () => headerMap[Symbol.iterator](),
    } as unknown as Headers,
    query: {
      get: (name: string) => queryMap.get(name) || null,
      has: (name: string) => queryMap.has(name),
      entries: () => queryMap.entries(),
      forEach: (cb: (value: string, key: string) => void) => queryMap.forEach(cb),
      keys: () => queryMap.keys(),
      values: () => queryMap.values(),
      [Symbol.iterator]: () => queryMap[Symbol.iterator](),
    } as unknown as URLSearchParams,
    params,
    json: async () => (body ? JSON.parse(JSON.stringify(body)) : null),
    text: async () => bodyString,
    arrayBuffer: async () => Buffer.from(bodyString).buffer,
    blob: async () => new Blob([bodyString]),
    formData: async () => {
      throw new Error('Use createMultipartRequest for form data');
    },
    body: null,
    bodyUsed: false,
    clone: () => createMockRequest(options),
    user: null,
  } as unknown as HttpRequest;
}

export function createMockContext(): InvocationContext {
  return {
    invocationId: 'test-invocation-id',
    functionName: 'test-function',
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    extraInputs: { get: jest.fn() },
    extraOutputs: { set: jest.fn() },
    triggerMetadata: {},
    options: {},
    retryContext: undefined,
    traceContext: undefined,
  } as unknown as InvocationContext;
}

export function setupTestServices() {
  const database = new MockDatabaseService();
  const storage = new MockStorageService();
  const aiCaption = new MockAICaptionService();

  registerServices({ database, storage, aiCaption });

  return { database, storage, aiCaption };
}
