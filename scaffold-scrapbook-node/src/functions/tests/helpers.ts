import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { HttpResponseInit } from '@azure/functions';

const TEST_JWT_SECRET = 'test-secret';

export function makeToken(userId: string): string {
  return jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

export interface MockHttpRequest {
  method: string;
  url: string;
  headers: { get: (key: string) => string | null };
  params: Record<string, string>;
  query: { get: (key: string) => string | null; forEach: (cb: (value: string, key: string) => void) => void };
  json: () => Promise<unknown>;
  formData: () => Promise<FormData>;
}

export interface MockInvocationContext {
  functionName: string;
  log: ReturnType<typeof vi.fn>;
  extraInputs: { get: ReturnType<typeof vi.fn> };
  extraOutputs: { set: ReturnType<typeof vi.fn> };
}

export type HandlerFn = (
  request: MockHttpRequest,
  context: MockInvocationContext
) => Promise<HttpResponseInit>;

export interface MockRequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  formData?: FormData;
}

export function createMockRequest(opts: MockRequestOptions): MockHttpRequest {
  const url = new URL('http://localhost:7071/api/test');
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }
  return {
    method: opts.method || 'GET',
    url: url.toString(),
    headers: {
      get: (key: string) => {
        const h = opts.headers || {};
        return h[key] || h[key.toLowerCase()] || null;
      },
    },
    params: opts.params || {},
    query: {
      get: (key: string) => url.searchParams.get(key),
      forEach: (cb: (value: string, key: string) => void) => {
        url.searchParams.forEach(cb);
      },
    },
    json: async () => opts.body || {},
    formData: async () => opts.formData || new FormData(),
  };
}

export function createAuthenticatedRequest(userId: string, opts: MockRequestOptions): MockHttpRequest {
  const token = makeToken(userId);
  return createMockRequest({
    ...opts,
    headers: {
      ...opts.headers,
      authorization: `Bearer ${token}`,
    },
  });
}

export function createMockContext(): MockInvocationContext {
  return {
    functionName: 'test',
    log: vi.fn(),
    extraInputs: { get: vi.fn() },
    extraOutputs: { set: vi.fn() },
  };
}
