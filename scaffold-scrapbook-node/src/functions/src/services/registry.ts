import type { IDatabaseService } from './interfaces/IDatabaseService.js';
import type { IStorageService } from './interfaces/IStorageService.js';
import type { ICaptionService } from './interfaces/ICaptionService.js';
import type { IAuthService } from './interfaces/IAuthService.js';
import { DatabaseService } from './DatabaseService.js';
import { StorageService } from './StorageService.js';
import { CaptionService, NoOpCaptionService } from './CaptionService.js';
import { AuthService } from './AuthService.js';
import { loadConfig } from './config.js';
import { logger } from '../logger.js';

export interface ServiceRegistry {
  database: IDatabaseService;
  storage: IStorageService;
  caption: ICaptionService;
  auth: IAuthService;
}

let services: ServiceRegistry | null = null;

export function registerServices(registry: ServiceRegistry): void {
  services = registry;
}

export function getServices(): ServiceRegistry {
  if (!services) {
    services = initializeServices();
  }
  return services;
}

export function clearServices(): void {
  services = null;
}

function initializeServices(): ServiceRegistry {
  const config = loadConfig();

  const database = new DatabaseService(config.databaseUrl);
  const storage = new StorageService(config.storageConnectionString);
  const auth = new AuthService(config.jwtSecret);

  // Enhancement service — wrapped in try/catch (Rule 9)
  let caption: ICaptionService;
  try {
    caption = new CaptionService(config.azureOpenAiEndpoint, config.azureOpenAiApiKey);
  } catch (error) {
    logger.warn({ err: error }, 'Failed to initialize CaptionService — using no-op fallback');
    caption = new NoOpCaptionService();
  }

  return { database, storage, caption, auth };
}
