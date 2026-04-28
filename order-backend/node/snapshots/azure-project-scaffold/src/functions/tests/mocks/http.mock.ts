import type { InvocationContext } from '@azure/functions';

export function createMockContext(overrides: Partial<InvocationContext> = {}): InvocationContext {
  const log = jest.fn() as unknown as InvocationContext['log'];
  return {
    invocationId: 'test-invocation',
    functionName: 'test-fn',
    extraInputs: { get: jest.fn() } as unknown as InvocationContext['extraInputs'],
    extraOutputs: { set: jest.fn() } as unknown as InvocationContext['extraOutputs'],
    log,
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    options: {} as InvocationContext['options'],
    triggerMetadata: {},
    retryContext: undefined,
    traceContext: undefined,
    ...overrides,
  } as unknown as InvocationContext;
}

export function createJsonRequest(opts: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
}): import('@azure/functions').HttpRequest {
  const body = opts.body;
  return {
    url: opts.url,
    method: opts.method,
    params: opts.params ?? {},
    query: new URLSearchParams(),
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
  } as unknown as import('@azure/functions').HttpRequest;
}
