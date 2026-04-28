// Mock @azure/service-bus before importing the implementation
const sendMessages = jest.fn().mockResolvedValue(undefined);
const closeSender = jest.fn().mockResolvedValue(undefined);
const closeClient = jest.fn().mockResolvedValue(undefined);
const createSender = jest.fn(() => ({ sendMessages, close: closeSender }));

jest.mock('@azure/service-bus', () => ({
  ServiceBusClient: jest.fn().mockImplementation(() => ({
    createSender,
    close: closeClient,
  })),
}));

import { ServiceBusOrderQueue } from '../../src/services/serviceBusOrderQueue';
import { validQueueMessage } from '../fixtures/orders';

describe('ServiceBusOrderQueue', () => {
  beforeEach(() => {
    sendMessages.mockClear();
    createSender.mockClear();
    closeSender.mockClear();
    closeClient.mockClear();
  });

  it('creates a sender for the configured queue on construction', () => {
    new ServiceBusOrderQueue('Endpoint=sb://x/;SharedAccessKey=x', 'orders');
    expect(createSender).toHaveBeenCalledWith('orders');
  });

  it('enqueues a message with the orderId as messageId', async () => {
    const q = new ServiceBusOrderQueue('Endpoint=sb://x/;SharedAccessKey=x', 'orders');
    await q.enqueue(validQueueMessage);
    expect(sendMessages).toHaveBeenCalledWith({
      body: validQueueMessage,
      contentType: 'application/json',
      messageId: validQueueMessage.orderId,
    });
  });

  it('propagates SDK errors from enqueue', async () => {
    sendMessages.mockRejectedValueOnce(new Error('boom'));
    const q = new ServiceBusOrderQueue('Endpoint=sb://x/;SharedAccessKey=x', 'orders');
    await expect(q.enqueue(validQueueMessage)).rejects.toThrow('boom');
  });

  it('reports healthy when sender exists', async () => {
    const q = new ServiceBusOrderQueue('Endpoint=sb://x/;SharedAccessKey=x', 'orders');
    expect(await q.healthCheck()).toBe(true);
  });

  it('closes sender and client on close()', async () => {
    const q = new ServiceBusOrderQueue('Endpoint=sb://x/;SharedAccessKey=x', 'orders');
    await q.close();
    expect(closeSender).toHaveBeenCalledTimes(1);
    expect(closeClient).toHaveBeenCalledTimes(1);
  });
});
