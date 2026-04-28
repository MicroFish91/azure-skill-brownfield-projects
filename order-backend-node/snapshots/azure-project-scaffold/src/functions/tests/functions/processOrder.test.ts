jest.mock('@azure/functions', () => {
  const actual = jest.requireActual('@azure/functions');
  return {
    ...actual,
    app: { http: jest.fn(), serviceBusQueue: jest.fn(), timer: jest.fn() },
  };
});

import { registerServices, clearServices } from '../../src/services/registry';
import { InMemoryOrderQueue, InMemoryOrderRepository } from '../mocks/registry.mock';
import { createMockContext } from '../mocks/http.mock';
import { processOrderHandler } from '../../src/functions/processOrder';
import { validQueueMessage } from '../fixtures/orders';

describe('processOrder queue trigger', () => {
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository();
    registerServices({ orderQueue: new InMemoryOrderQueue(), orderRepository: repo });
  });

  afterEach(() => clearServices());

  it('writes a Validated order on a valid message', async () => {
    await processOrderHandler(validQueueMessage, createMockContext());
    const stored = repo.store.get(validQueueMessage.orderId);
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('Validated');
    expect(stored!.customerId).toBe(validQueueMessage.customerId);
    expect(stored!.items).toEqual(validQueueMessage.items);
    expect(stored!.createdAt).toBe(validQueueMessage.enqueuedAt);
    expect(typeof stored!.updatedAt).toBe('string');
  });

  it('writes a Rejected order with rejectionReason on invalid payload', async () => {
    await processOrderHandler(
      { ...validQueueMessage, items: [] },
      createMockContext(),
    );
    const stored = repo.store.get(validQueueMessage.orderId);
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('Rejected');
    expect(stored!.rejectionReason).toBeDefined();
    expect(stored!.items).toEqual([]);
  });

  it('discards messages missing orderId without writing or throwing', async () => {
    await expect(
      processOrderHandler({ customerId: 'x', items: [] }, createMockContext()),
    ).resolves.toBeUndefined();
    expect(repo.store.size).toBe(0);
  });

  it('throws when Cosmos write fails (so Service Bus retries)', async () => {
    repo.writeFailure = new Error('cosmos down');
    await expect(processOrderHandler(validQueueMessage, createMockContext())).rejects.toThrow(
      'cosmos down',
    );
  });
});
