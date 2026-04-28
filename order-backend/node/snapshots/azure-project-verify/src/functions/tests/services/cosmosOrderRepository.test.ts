// Mock @azure/cosmos before import
const itemRead = jest.fn();
const itemsCreate = jest.fn();
const containerRead = jest.fn().mockResolvedValue({ resource: {} });
const item = jest.fn(() => ({ read: itemRead }));
const items = { create: itemsCreate };
const container = { items, item, read: containerRead };
const createIfNotExistsContainer = jest.fn().mockResolvedValue({ container });
const containers = { createIfNotExists: createIfNotExistsContainer };
const database = { containers };
const createIfNotExistsDb = jest.fn().mockResolvedValue({ database });
const databases = { createIfNotExists: createIfNotExistsDb };

jest.mock('@azure/cosmos', () => ({
  CosmosClient: jest.fn().mockImplementation(() => ({ databases })),
}));

import { CosmosOrderRepository } from '../../src/services/cosmosOrderRepository';
import { sampleOrder } from '../fixtures/orders';

describe('CosmosOrderRepository', () => {
  beforeEach(() => {
    itemRead.mockReset();
    itemsCreate.mockReset();
    containerRead.mockClear().mockResolvedValue({ resource: {} });
    createIfNotExistsContainer.mockClear();
    createIfNotExistsDb.mockClear();
  });

  it('initializes the database and container with /orderId partition key', async () => {
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    await repo.initialize();
    expect(createIfNotExistsDb).toHaveBeenCalledWith({ id: 'db' });
    expect(createIfNotExistsContainer).toHaveBeenCalledWith({
      id: 'orders',
      partitionKey: { paths: ['/orderId'] },
    });
  });

  it('initializes only once across concurrent calls', async () => {
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    await Promise.all([repo.initialize(), repo.initialize(), repo.initialize()]);
    expect(createIfNotExistsDb).toHaveBeenCalledTimes(1);
  });

  it('create() inserts the order and strips Cosmos metadata from the result', async () => {
    itemsCreate.mockResolvedValueOnce({
      resource: { ...sampleOrder, _rid: 'r', _self: 's', _etag: 'e', _attachments: 'a', _ts: 1 },
    });
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    const result = await repo.create(sampleOrder);
    expect(itemsCreate).toHaveBeenCalledWith(sampleOrder);
    expect(result).toEqual(sampleOrder);
    expect((result as unknown as Record<string, unknown>)._rid).toBeUndefined();
  });

  it('create() throws when Cosmos returns no resource', async () => {
    itemsCreate.mockResolvedValueOnce({ resource: undefined });
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    await expect(repo.create(sampleOrder)).rejects.toThrow(/no resource/);
  });

  it('findById() reads with id and partition key both equal to orderId', async () => {
    itemRead.mockResolvedValueOnce({ resource: sampleOrder });
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    const result = await repo.findById(sampleOrder.orderId);
    expect(item).toHaveBeenCalledWith(sampleOrder.orderId, sampleOrder.orderId);
    expect(result).toEqual(sampleOrder);
  });

  it('findById() returns null on 404', async () => {
    itemRead.mockRejectedValueOnce({ code: 404 });
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    expect(await repo.findById('missing')).toBeNull();
  });

  it('findById() rethrows non-404 errors', async () => {
    itemRead.mockRejectedValueOnce(new Error('boom'));
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    await expect(repo.findById('x')).rejects.toThrow('boom');
  });

  it('healthCheck() returns false when initialize fails', async () => {
    createIfNotExistsDb.mockRejectedValueOnce(new Error('cosmos down'));
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    expect(await repo.healthCheck()).toBe(false);
  });

  it('healthCheck() returns true when container.read succeeds', async () => {
    const repo = new CosmosOrderRepository('AccountEndpoint=https://x/;AccountKey=x', 'db', 'orders');
    expect(await repo.healthCheck()).toBe(true);
  });
});
