import type { IOrderQueue, OrderQueueMessage } from '../../src/services/interfaces/IOrderQueue';
import type { IOrderRepository } from '../../src/services/interfaces/IOrderRepository';
import type { Order } from '@app/shared';

export class InMemoryOrderQueue implements IOrderQueue {
  readonly messages: OrderQueueMessage[] = [];
  shouldFail = false;
  healthy = true;

  async enqueue(message: OrderQueueMessage): Promise<void> {
    if (this.shouldFail) {
      throw new Error('queue unavailable');
    }
    this.messages.push(message);
  }

  async healthCheck(): Promise<boolean> {
    return this.healthy;
  }

  async close(): Promise<void> {
    /* no-op */
  }
}

export class InMemoryOrderRepository implements IOrderRepository {
  readonly store = new Map<string, Order>();
  readFailure: Error | null = null;
  writeFailure: Error | null = null;
  healthy = true;

  async initialize(): Promise<void> {
    /* no-op */
  }

  async create(order: Order): Promise<Order> {
    if (this.writeFailure) throw this.writeFailure;
    this.store.set(order.orderId, order);
    return order;
  }

  async findById(orderId: string): Promise<Order | null> {
    if (this.readFailure) throw this.readFailure;
    return this.store.get(orderId) ?? null;
  }

  async healthCheck(): Promise<boolean> {
    return this.healthy;
  }
}
