import type { Order, OrderStatus } from './entities';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details: unknown | null;
  };
}

export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
}

export type GetOrderResponse = Order;

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
}
