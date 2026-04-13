import { describe, it, expect, vi } from 'vitest';
import type { HandlerFn, MockInvocationContext } from '../helpers.js';
import { createMockRequest, createMockContext } from '../helpers.js';
import { registerServices, clearServices } from '../../src/services/registry.js';
import { MockDatabaseService } from '../mocks/mockDatabaseService.js';
import { MockStorageService } from '../mocks/mockStorageService.js';
import { MockCaptionService } from '../mocks/mockCaptionService.js';
import { MockAuthService } from '../mocks/mockAuthService.js';

const handlers: Record<string, HandlerFn> = {};

vi.mock('@azure/functions', () => ({
  app: {
    http: (name: string, options: { handler: HandlerFn }) => {
      handlers[name] = options.handler;
    },
  },
}));

await import('../../src/functions/health.js');

describe('GET /api/health', () => {
  it('should return 200 with healthy when all services up', async () => {
    const req = createMockRequest({ method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.health(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      status: 'healthy',
      services: { database: true, storage: true, caption: true },
    });
  });

  it('should return 200 with degraded when enhancement service down', async () => {
    clearServices();
    registerServices({
      database: new MockDatabaseService(),
      storage: new MockStorageService(),
      caption: new MockCaptionService({ shouldFail: true }),
      auth: new MockAuthService(),
    });

    const req = createMockRequest({ method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.health(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      status: 'degraded',
      services: { database: true, storage: true, caption: false },
    });
  });

  it('should return 503 with unhealthy when essential service down', async () => {
    clearServices();
    const db = new MockDatabaseService();
    db.healthCheck = async () => false;
    registerServices({
      database: db,
      storage: new MockStorageService(),
      caption: new MockCaptionService(),
      auth: new MockAuthService(),
    });

    const req = createMockRequest({ method: 'GET' });
    const ctx = createMockContext();

    const res = await handlers.health(req, ctx as unknown as MockInvocationContext);

    expect(res.status).toBe(503);
    expect(res.jsonBody).toMatchObject({
      status: 'unhealthy',
    });
  });
});
