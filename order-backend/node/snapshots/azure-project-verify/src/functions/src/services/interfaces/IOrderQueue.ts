import type { Order } from '@app/shared';

/**
 * Message envelope placed on the Service Bus orders queue by `createOrder`
 * and consumed by `processOrder`.
 */
export interface OrderQueueMessage {
  orderId: string;
  customerId: string;
  items: Array<{ sku: string; quantity: number; unitPrice: number }>;
  enqueuedAt: string;
}

export interface IOrderQueue {
  /** Enqueue a new order. Throws on transport failure. */
  enqueue(message: OrderQueueMessage): Promise<void>;
  /** Lightweight reachability check. Never throws. */
  healthCheck(): Promise<boolean>;
  /** Release any underlying connections. */
  close(): Promise<void>;
}

export type { Order };
