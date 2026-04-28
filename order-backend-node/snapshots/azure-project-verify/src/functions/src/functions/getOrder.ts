import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { orderIdParamSchema, type GetOrderResponse } from '@app/shared';
import { getServices } from '../services/registry';
import { withErrorHandling } from '../middleware/withErrorHandling';
import { NotFoundError, ServiceUnavailableError } from '../errors/AppError';

async function getOrderHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const orderId = orderIdParamSchema.parse(request.params.id);
  const { orderRepository } = getServices();

  let order;
  try {
    order = await orderRepository.findById(orderId);
  } catch (err) {
    throw new ServiceUnavailableError('Failed to read order', {
      cause: err instanceof Error ? err.message : String(err),
    });
  }

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  const response: GetOrderResponse = order;
  return { status: 200, jsonBody: response };
}

export const getOrder = withErrorHandling(getOrderHandler);

app.http('getOrder', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'orders/{id}',
  handler: getOrder,
});

export { getOrderHandler };
