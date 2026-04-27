import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { vi } from 'vitest';

export interface MockRequestOptions {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  formData?: () => Promise<FormData>;
  arrayBuffer?: () => Promise<ArrayBuffer>;
}

export type HandlerFn = (
  req: HttpRequest,
  ctx: InvocationContext
) => Promise<HttpResponseInit>;

export function createMockRequest(opts: MockRequestOptions = {}): HttpRequest {
  const url = new URL(opts.url ?? 'http://localhost:7071/api/test');
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  }
  const headers = new Map<string, string>();
  for (const [k, v] of Object.entries(opts.headers ?? {})) headers.set(k.toLowerCase(), v);

  const req: Partial<HttpRequest> & { [k: string]: unknown } = {
    method: opts.method ?? 'GET',
    url: url.toString(),
    params: opts.params ?? {},
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
      has: (key: string) => headers.has(key.toLowerCase()),
      set: () => undefined,
      delete: () => undefined,
      [Symbol.iterator]: () => headers.entries()
    } as unknown as HttpRequest['headers'],
    query: {
      get: (key: string) => url.searchParams.get(key)
    } as unknown as HttpRequest['query'],
    json: async () => opts.body ?? {},
    text: async () => (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body ?? '')),
    formData: opts.formData ?? (async () => {
      throw new Error('No form data');
    }),
    arrayBuffer: opts.arrayBuffer ?? (async () => new ArrayBuffer(0))
  };
  return req as HttpRequest;
}

export function createMockContext(): InvocationContext {
  return {
    invocationId: 'test-invocation',
    functionName: 'test',
    extraInputs: { get: vi.fn(), set: vi.fn() },
    extraOutputs: { get: vi.fn(), set: vi.fn() },
    log: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    options: {} as InvocationContext['options']
  } as unknown as InvocationContext;
}

export function authedHeaders(token = 'valid-token'): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

/** Build a multipart FormData containing a single image file. */
export function buildPhotoFormData(
  bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
  filename = 'photo.jpg',
  type = 'image/jpeg'
): FormData {
  const fd = new FormData();
  fd.set('file', new File([bytes], filename, { type }));
  return fd;
}
