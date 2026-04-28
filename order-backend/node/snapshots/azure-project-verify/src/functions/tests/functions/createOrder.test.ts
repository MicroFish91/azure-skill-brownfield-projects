jest.mock('@azure/functions', () => {
  const actual = jest.requireActual('@azure/functions');
  return {
    ...actual,
    app: {
      http: jest.fn(),
      serviceBusQueue: jest.fn(),
      timer: jest.fn(),
    },
  };
});

import { registerServices, clearServices } from '../../src/services/registry';
import { InMemoryOrderQueue, InMemoryOrderRepository } from '../mocks/registry.mock';
import { createMockContext, createJsonRequest } from '../mocks/http.mock';
import { createOrder as createOrderHandler } from '../../src/functions/createOrder';
import { validCreateOrderBody } from '../fixtures/orders';
import type { CreateOrderResponse, ErrorResponse } from '@app/shared';

describe('createOrder handler', () => {
  let queue: InMemoryOrderQueue;

  beforeEach(() => {
    queue = new InMemoryOrderQueue();
    registerServices({
      orderQueue: queue,
      orderRepository: new InMemoryOrderRepository(),
    });
  });

  afterEach(() => clearServices());

  it('returns 202 and a Pending order, and enqueues a message', async () => {
    const req = createJsonRequest({
      url: 'http://localhost/api/orders',
      method: 'POST',
      body: validCreateOrderBody,
    });
    const res = await createOrderHandler(req, createMockContext());
    expect(res.status).toBe(202);
    const body = res.jsonBody as CreateOrderResponse;
    expect(body.status).toBe('Pending');
    expect(body.orderId).toMatch(/^[0-9a-f-]{36}$/);
    expect(queue.messages).toHaveLength(1);
    expect(queue.messages[0]).toMatchObject({
      orderId: body.orderId,
      customerId: validCreateOrderBody.customerId,
      items: validCreateOrderBody.items,
    });
    expect(typeof queue.messages[0].enqueuedAt).toBe('string');
  });

  it('returns 422 with VALIDATION_ERROR for an invalid body', async () => {
    const req = createJsonRequest({
      url: 'http://localhost/api/orders',
      method: 'POST',
      body: { customerId: '', items: [] },
    });
    const res = await createOrderHandler(req, createMockContext());
    expect(res.status).toBe(422);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('VALIDATION_ERROR');
    expect(queue.messages).toHaveLength(0);
  });

  it('returns 503 when the queue throws', async () => {
    queue.shouldFail = true;
    const req = createJsonRequest({
      url: 'http://localhost/api/orders',
      method: 'POST',
      body: validCreateOrderBody,
    });
    const res = await createOrderHandler(req, createMockContext());
    expect(res.status).toBe(503);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('returns 422 for malformed JSON body', async () => {
    const req = createJsonRequest({
      url: 'http://localhost/api/orders',
      method: 'POST',
      body: undefined,
    });
    // Force json() to reject, mimicking malformed JSON
    (req as unknown as { json: () => Promise<unknown> }).json = () => Promise.reject(new Error('bad'));
    const res = await createOrderHandler(req, createMockContext());
    expect(res.status).toBe(422);
  });
});
