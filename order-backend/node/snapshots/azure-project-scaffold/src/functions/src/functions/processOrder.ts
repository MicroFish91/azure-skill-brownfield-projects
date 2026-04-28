import { app, type InvocationContext } from '@azure/functions';
import type { Order, OrderStatus } from '@app/shared';
import { createOrderSchema } from '@app/shared';
import { getServices } from '../services/registry';
import { getLogger } from '../logger';

const log = getLogger('processOrder');

interface IncomingMessage {
  orderId?: unknown;
  customerId?: unknown;
  items?: unknown;
  enqueuedAt?: unknown;
}

/**
 * Service Bus queue trigger.
 *
 * - Validates the message body. If invalid → write `Rejected` order (terminal).
 * - On Cosmos write failure → throw to allow Service Bus retry / dead-letter.
 */
export async function processOrderHandler(
  message: unknown,
  context: InvocationContext,
): Promise<void> {
  const msg = (message ?? {}) as IncomingMessage;
  const orderId = typeof msg.orderId === 'string' ? msg.orderId : null;

  if (!orderId) {
    log.error({ invocationId: context.invocationId }, 'message missing orderId — discarding');
    return;
  }

  const now = new Date().toISOString();
  const { orderRepository } = getServices();

  const parsed = createOrderSchema.safeParse({
    customerId: msg.customerId,
    items: msg.items,
  });

  let order: Order;
  let status: OrderStatus;
  if (parsed.success) {
    status = 'Validated';
    order = {
      orderId,
      customerId: parsed.data.customerId,
      items: parsed.data.items,
      status,
      createdAt: typeof msg.enqueuedAt === 'string' ? msg.enqueuedAt : now,
      updatedAt: now,
    };
  } else {
    status = 'Rejected';
    order = {
      orderId,
      customerId: typeof msg.customerId === 'string' ? msg.customerId : 'unknown',
      items: [],
      status,
      rejectionReason: JSON.stringify(parsed.error.flatten()),
      createdAt: typeof msg.enqueuedAt === 'string' ? msg.enqueuedAt : now,
      updatedAt: now,
    };
    log.warn({ orderId, errors: parsed.error.flatten() }, 'order rejected');
  }

  await orderRepository.create(order);
  log.info({ orderId, status }, 'order persisted');
}

app.serviceBusQueue('processOrder', {
  connection: 'SERVICE_BUS_CONNECTION_STRING',
  queueName: '%SERVICE_BUS_ORDERS_QUEUE%',
  handler: processOrderHandler,
});
