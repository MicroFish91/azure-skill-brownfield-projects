import {
  registerServices,
  getServices,
  clearServices,
  initializeServices,
} from '../../src/services/registry';
import { InMemoryOrderQueue, InMemoryOrderRepository } from '../mocks/registry.mock';

describe('service registry', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    clearServices();
  });

  afterEach(() => {
    clearServices();
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns registered mocks', () => {
    const reg = {
      orderQueue: new InMemoryOrderQueue(),
      orderRepository: new InMemoryOrderRepository(),
    };
    registerServices(reg);
    expect(getServices()).toBe(reg);
  });

  it('allows re-registration after clearServices', () => {
    const a = { orderQueue: new InMemoryOrderQueue(), orderRepository: new InMemoryOrderRepository() };
    const b = { orderQueue: new InMemoryOrderQueue(), orderRepository: new InMemoryOrderRepository() };
    registerServices(a);
    clearServices();
    registerServices(b);
    expect(getServices()).toBe(b);
  });

  it('auto-initializes from env when nothing is registered', () => {
    process.env.SERVICE_BUS_CONNECTION_STRING =
      'Endpoint=sb://localhost/;SharedAccessKeyName=x;SharedAccessKey=x';
    process.env.SERVICE_BUS_ORDERS_QUEUE = 'orders';
    process.env.COSMOSDB_CONNECTION_STRING =
      'AccountEndpoint=https://localhost:8081/;AccountKey=key';
    process.env.COSMOSDB_DATABASE = 'orders-db';
    process.env.COSMOSDB_CONTAINER = 'orders';

    const services = getServices();
    expect(services.orderQueue).toBeDefined();
    expect(services.orderRepository).toBeDefined();
  });

  it('initializeServices throws when required env vars missing', () => {
    delete process.env.SERVICE_BUS_CONNECTION_STRING;
    delete process.env.COSMOSDB_CONNECTION_STRING;
    expect(() => initializeServices()).toThrow(/Missing required environment variables/);
  });
});
