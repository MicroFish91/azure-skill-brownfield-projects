import type { Order } from '@app/shared';

export interface IOrderRepository {
  /** Idempotently create the database/container on first use. */
  initialize(): Promise<void>;
  /** Insert a new order. */
  create(order: Order): Promise<Order>;
  /** Look up by `orderId` (also the partition key). Returns `null` if missing. */
  findById(orderId: string): Promise<Order | null>;
  /** Lightweight reachability check. Never throws. */
  healthCheck(): Promise<boolean>;
}
