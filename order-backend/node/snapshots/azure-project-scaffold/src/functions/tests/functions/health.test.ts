jest.mock('@azure/functions', () => {
  const actual = jest.requireActual('@azure/functions');
  return {
    ...actual,
    app: { http: jest.fn(), serviceBusQueue: jest.fn(), timer: jest.fn() },
  };
});

import { registerServices, clearServices } from '../../src/services/registry';
import { InMemoryOrderQueue, InMemoryOrderRepository } from '../mocks/registry.mock';
import { createMockContext, createJsonRequest } from '../mocks/http.mock';
import { healthHandler } from '../../src/functions/health';
import type { HealthResponse } from '@app/shared';

describe('health handler', () => {
  let queue: InMemoryOrderQueue;
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    queue = new InMemoryOrderQueue();
    repo = new InMemoryOrderRepository();
    registerServices({ orderQueue: queue, orderRepository: repo });
  });

  afterEach(() => clearServices());

  const req = () => createJsonRequest({ url: 'http://localhost/api/health', method: 'GET' });

  it('returns 200 healthy when both services are up', async () => {
    const res = await healthHandler(req(), createMockContext());
    expect(res.status).toBe(200);
    const body = res.jsonBody as HealthResponse;
    expect(body.status).toBe('healthy');
    expect(body.services).toEqual({ serviceBus: true, cosmos: true });
  });

  it('returns 200 degraded when one service is down', async () => {
    repo.healthy = false;
    const res = await healthHandler(req(), createMockContext());
    expect(res.status).toBe(200);
    expect((res.jsonBody as HealthResponse).status).toBe('degraded');
  });

  it('returns 503 unhealthy when all services are down', async () => {
    queue.healthy = false;
    repo.healthy = false;
    const res = await healthHandler(req(), createMockContext());
    expect(res.status).toBe(503);
    expect((res.jsonBody as HealthResponse).status).toBe('unhealthy');
  });
});
