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
import { getOrder as getOrderHandler } from '../../src/functions/getOrder';
import { sampleOrder } from '../fixtures/orders';
import type { ErrorResponse, GetOrderResponse } from '@app/shared';

describe('getOrder handler', () => {
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository();
    registerServices({ orderQueue: new InMemoryOrderQueue(), orderRepository: repo });
  });

  afterEach(() => clearServices());

  it('returns 200 and the order when found', async () => {
    repo.store.set(sampleOrder.orderId, sampleOrder);
    const req = createJsonRequest({
      url: `http://localhost/api/orders/${sampleOrder.orderId}`,
      method: 'GET',
      params: { id: sampleOrder.orderId },
    });
    const res = await getOrderHandler(req, createMockContext());
    expect(res.status).toBe(200);
    expect(res.jsonBody as GetOrderResponse).toEqual(sampleOrder);
  });

  it('returns 404 when not found', async () => {
    const id = '33333333-3333-4333-8333-333333333333';
    const req = createJsonRequest({
      url: `http://localhost/api/orders/${id}`,
      method: 'GET',
      params: { id },
    });
    const res = await getOrderHandler(req, createMockContext());
    expect(res.status).toBe(404);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('NOT_FOUND');
  });

  it('returns 422 for invalid UUID', async () => {
    const req = createJsonRequest({
      url: 'http://localhost/api/orders/not-a-uuid',
      method: 'GET',
      params: { id: 'not-a-uuid' },
    });
    const res = await getOrderHandler(req, createMockContext());
    expect(res.status).toBe(422);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 503 when Cosmos read throws', async () => {
    repo.readFailure = new Error('cosmos down');
    const req = createJsonRequest({
      url: `http://localhost/api/orders/${sampleOrder.orderId}`,
      method: 'GET',
      params: { id: sampleOrder.orderId },
    });
    const res = await getOrderHandler(req, createMockContext());
    expect(res.status).toBe(503);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
