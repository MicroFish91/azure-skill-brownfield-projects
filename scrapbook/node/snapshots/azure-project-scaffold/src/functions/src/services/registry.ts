import type { AppConfig } from './config.js';
import { loadConfig } from './config.js';
import type { IUserRepository } from './interfaces/IUserRepository.js';
import type { ICoupleRepository } from './interfaces/ICoupleRepository.js';
import type { IPhotoRepository } from './interfaces/IPhotoRepository.js';
import type { IBlobStorage } from './interfaces/IBlobStorage.js';
import type { ICaptionService } from './interfaces/ICaptionService.js';
import type { IAuthValidator } from './interfaces/IAuthValidator.js';
import { PostgresUserRepository } from './postgres/UserRepository.js';
import { PostgresCoupleRepository } from './postgres/CoupleRepository.js';
import { PostgresPhotoRepository } from './postgres/PhotoRepository.js';
import { AzureBlobStorage } from './blob/BlobStorage.js';
import { AzureOpenAiCaptionService } from './openai/CaptionService.js';
import { EntraAuthValidator } from './auth/EntraValidator.js';
import { logger } from '../lib/logger.js';

export interface ServiceContainer {
  config: AppConfig;
  users: IUserRepository;
  couples: ICoupleRepository;
  photos: IPhotoRepository;
  blob: IBlobStorage;
  captions: ICaptionService;
  auth: IAuthValidator;
}

let services: ServiceContainer | null = null;

export function registerServices(custom: ServiceContainer): void {
  services = custom;
}

export function resetServicesForTesting(): void {
  services = null;
}

function initializeServices(): ServiceContainer {
  const config = loadConfig();
  return {
    config,
    users: new PostgresUserRepository(config),
    couples: new PostgresCoupleRepository(config),
    photos: new PostgresPhotoRepository(config),
    blob: new AzureBlobStorage(config),
    // Enhancement: caption service constructor MUST NOT throw on missing config.
    captions: safeCaption(config),
    auth: new EntraAuthValidator(config)
  };
}

function safeCaption(config: AppConfig): ICaptionService {
  try {
    return new AzureOpenAiCaptionService(config);
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'caption service init failed; using inert fallback');
    return {
      async generate() {
        return { caption: 'A new memory ✨', source: 'fallback' };
      },
      async ping() {
        return { available: false, message: 'caption service unavailable' };
      }
    };
  }
}

export function getServices(): ServiceContainer {
  if (services === null) {
    services = initializeServices();
  }
  return services;
}
