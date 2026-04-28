import type { Order } from '@app/shared';
import type { OrderQueueMessage } from '../../src/services/interfaces/IOrderQueue';

export const validCreateOrderBody = {
  customerId: 'cust-123',
  items: [
    { sku: 'sku-1', quantity: 2, unitPrice: 9.99 },
    { sku: 'sku-2', quantity: 1, unitPrice: 4.5 },
  ],
};

export const validQueueMessage: OrderQueueMessage = {
  orderId: '11111111-1111-4111-8111-111111111111',
  customerId: 'cust-123',
  items: validCreateOrderBody.items,
  enqueuedAt: '2026-04-27T00:00:00.000Z',
};

export const sampleOrder: Order = {
  orderId: '22222222-2222-4222-8222-222222222222',
  customerId: 'cust-456',
  items: validCreateOrderBody.items,
  status: 'Validated',
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
};
