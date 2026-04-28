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
import { createOrder as createOrderHandler } from '../../src/functions/createOrder';
import { getOrder as getOrderHandler } from '../../src/functions/getOrder';
import { processOrderHandler } from '../../src/functions/processOrder';
import { validCreateOrderBody } from '../fixtures/orders';
import type { CreateOrderResponse, GetOrderResponse } from '@app/shared';

/**
 * End-to-end happy path with mocked Azure clients:
 *   POST /api/orders  → 202 Pending, message on the queue
 *   processOrder      ← consumes the message and writes to Cosmos
 *   GET  /api/orders/{id} → 200 Validated
 */
describe('integration: order flow', () => {
  let queue: InMemoryOrderQueue;
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    queue = new InMemoryOrderQueue();
    repo = new InMemoryOrderRepository();
    registerServices({ orderQueue: queue, orderRepository: repo });
  });

  afterEach(() => clearServices());

  it('flows from POST → queue → processOrder → GET', async () => {
    // 1. Submit order
    const postRes = await createOrderHandler(
      createJsonRequest({
        url: 'http://localhost/api/orders',
        method: 'POST',
        body: validCreateOrderBody,
      }),
      createMockContext(),
    );
    expect(postRes.status).toBe(202);
    const { orderId, status } = postRes.jsonBody as CreateOrderResponse;
    expect(status).toBe('Pending');

    // 2. Pre-GET: not in Cosmos yet (only queued)
    const earlyGet = await getOrderHandler(
      createJsonRequest({
        url: `http://localhost/api/orders/${orderId}`,
        method: 'GET',
        params: { id: orderId },
      }),
      createMockContext(),
    );
    expect(earlyGet.status).toBe(404);

    // 3. Drain the queue through the processor
    expect(queue.messages).toHaveLength(1);
    for (const msg of queue.messages.splice(0)) {
      await processOrderHandler(msg, createMockContext());
    }

    // 4. GET now returns the validated order
    const getRes = await getOrderHandler(
      createJsonRequest({
        url: `http://localhost/api/orders/${orderId}`,
        method: 'GET',
        params: { id: orderId },
      }),
      createMockContext(),
    );
    expect(getRes.status).toBe(200);
    const order = getRes.jsonBody as GetOrderResponse;
    expect(order.orderId).toBe(orderId);
    expect(order.status).toBe('Validated');
    expect(order.customerId).toBe(validCreateOrderBody.customerId);
    expect(order.items).toEqual(validCreateOrderBody.items);
  });

  it('rejects an invalid order at the queue trigger and persists it as Rejected', async () => {
    const orderId = '44444444-4444-4444-8444-444444444444';
    await processOrderHandler(
      { orderId, customerId: 'cust', items: [], enqueuedAt: '2026-04-27T00:00:00.000Z' },
      createMockContext(),
    );
    const get = await getOrderHandler(
      createJsonRequest({
        url: `http://localhost/api/orders/${orderId}`,
        method: 'GET',
        params: { id: orderId },
      }),
      createMockContext(),
    );
    expect(get.status).toBe(200);
    expect((get.jsonBody as GetOrderResponse).status).toBe('Rejected');
  });
});
