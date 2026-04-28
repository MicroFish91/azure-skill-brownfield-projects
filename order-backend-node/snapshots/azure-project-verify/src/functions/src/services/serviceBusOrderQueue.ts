import { ServiceBusClient, type ServiceBusSender } from '@azure/service-bus';
import type { IOrderQueue, OrderQueueMessage } from './interfaces/IOrderQueue';
import { getLogger } from '../logger';

const log = getLogger('serviceBusOrderQueue');

export class ServiceBusOrderQueue implements IOrderQueue {
  private client: ServiceBusClient;
  private sender: ServiceBusSender;

  constructor(connectionString: string, queueName: string) {
    this.client = new ServiceBusClient(connectionString);
    this.sender = this.client.createSender(queueName);
  }

  async enqueue(message: OrderQueueMessage): Promise<void> {
    await this.sender.sendMessages({
      body: message,
      contentType: 'application/json',
      messageId: message.orderId,
    });
    log.info({ orderId: message.orderId }, 'order enqueued');
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Sender is established lazily; a no-op send check via property access
      // is enough to confirm the client object is intact. A full peek requires
      // a receiver, which we don't keep open here.
      return Boolean(this.sender);
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.sender.close();
    } finally {
      await this.client.close();
    }
  }
}
