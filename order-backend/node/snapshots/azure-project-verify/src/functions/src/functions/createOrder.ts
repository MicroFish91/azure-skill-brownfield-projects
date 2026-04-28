import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { v4 as uuid } from 'uuid';
import { createOrderSchema, type CreateOrderResponse } from '@app/shared';
import { getServices } from '../services/registry';
import { withErrorHandling } from '../middleware/withErrorHandling';
import { ServiceUnavailableError } from '../errors/AppError';

async function createOrderHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const raw = await request.json().catch(() => ({}));
  const body = createOrderSchema.parse(raw);

  const orderId = uuid();
  const enqueuedAt = new Date().toISOString();
  const { orderQueue } = getServices();

  try {
    await orderQueue.enqueue({
      orderId,
      customerId: body.customerId,
      items: body.items,
      enqueuedAt,
    });
  } catch (err) {
    throw new ServiceUnavailableError('Failed to enqueue order', {
      cause: err instanceof Error ? err.message : String(err),
    });
  }

  const response: CreateOrderResponse = { orderId, status: 'Pending' };
  return { status: 202, jsonBody: response };
}

export const createOrder = withErrorHandling(createOrderHandler);

app.http('createOrder', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'orders',
  handler: createOrder,
});

export { createOrderHandler };
