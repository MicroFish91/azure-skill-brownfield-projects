import { z } from 'zod';

export const orderItemSchema = z.object({
  sku: z.string().min(1, 'sku is required').max(64),
  quantity: z.number().int().positive('quantity must be a positive integer'),
  unitPrice: z.number().nonnegative('unitPrice must be >= 0'),
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1, 'customerId is required').max(128),
  items: z.array(orderItemSchema).min(1, 'order must contain at least one item'),
});

export const orderIdParamSchema = z
  .string()
  .uuid('orderId must be a UUID');

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
