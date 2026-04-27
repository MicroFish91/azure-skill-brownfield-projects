import { describe, it, expect } from 'vitest';
import type { HealthResponse } from '@app/shared';
import { healthHandler } from '../../src/functions/health.js';
import { getServices } from '../../src/services/registry.js';
import { createMockContext, createMockRequest } from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

describe('GET /api/health', () => {
  it('returns 200 healthy when all services are healthy', async () => {
    const res = await healthHandler(createMockRequest(), createMockContext());
    expect(res.status).toBe(200);
    const body = res.jsonBody as HealthResponse;
    expect(body.status).toBe('healthy');
    expect(body.services.postgres.status).toBe('healthy');
    expect(body.services.blob.status).toBe('healthy');
    expect(body.services.captions.status).toBe('healthy');
  });

  it('returns 200 degraded when only the Enhancement caption service is unhealthy', async () => {
    const services = getServices() as MockServiceContainer;
    services.captions.available = false;

    const res = await healthHandler(createMockRequest(), createMockContext());
    expect(res.status).toBe(200);
    const body = res.jsonBody as HealthResponse;
    expect(body.status).toBe('degraded');
    expect(body.services.captions.status).toBe('unhealthy');
  });

  it('returns 503 unhealthy when an Essential service is down', async () => {
    const services = getServices() as MockServiceContainer;
    services.blob.shouldFailPing = true;

    const res = await healthHandler(createMockRequest(), createMockContext());
    expect(res.status).toBe(503);
    const body = res.jsonBody as HealthResponse;
    expect(body.status).toBe('unhealthy');
    expect(body.services.blob.status).toBe('unhealthy');
  });
});
