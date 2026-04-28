import type { IOrderQueue } from './interfaces/IOrderQueue';
import type { IOrderRepository } from './interfaces/IOrderRepository';
import { loadConfig } from './config';
import { ServiceBusOrderQueue } from './serviceBusOrderQueue';
import { CosmosOrderRepository } from './cosmosOrderRepository';

export interface ServiceRegistry {
  orderQueue: IOrderQueue;
  orderRepository: IOrderRepository;
}

let services: ServiceRegistry | null = null;

/** Used by tests to inject mocks. */
export function registerServices(registry: ServiceRegistry): void {
  services = registry;
}

/** Reset the registry — used in test teardown. */
export function clearServices(): void {
  services = null;
}

/** Construct concrete implementations from environment config. */
export function initializeServices(): ServiceRegistry {
  const config = loadConfig();
  const orderQueue = new ServiceBusOrderQueue(
    config.serviceBusConnectionString,
    config.serviceBusOrdersQueue,
  );
  const orderRepository = new CosmosOrderRepository(
    config.cosmosConnectionString,
    config.cosmosDatabase,
    config.cosmosContainer,
  );
  return { orderQueue, orderRepository };
}

/**
 * Returns services. Auto-initializes with concrete implementations when
 * none have been registered (e.g., when running under `func start`).
 */
export function getServices(): ServiceRegistry {
  if (services === null) {
    services = initializeServices();
  }
  return services;
}
