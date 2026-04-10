import { IDatabaseService } from './interfaces/IDatabaseService';
import { IStorageService } from './interfaces/IStorageService';
import { IAICaptionService } from './interfaces/IAICaptionService';

export interface ServiceRegistry {
  database: IDatabaseService;
  storage: IStorageService;
  aiCaption: IAICaptionService;
}

let services: ServiceRegistry | null = null;

export function registerServices(s: ServiceRegistry): void {
  services = s;
}

export function getServices(): ServiceRegistry {
  if (!services) {
    const { PostgresDatabaseService } = require('./database');
    const { AzureBlobStorageService } = require('./storage');
    const { AzureOpenAICaptionService } = require('./aiCaption');
    const { getConfig } = require('./config');
    const config = getConfig();

    services = {
      database: new PostgresDatabaseService(config.DATABASE_URL),
      storage: new AzureBlobStorageService(config.STORAGE_CONNECTION_STRING),
      aiCaption: new AzureOpenAICaptionService(
        config.AZURE_OPENAI_ENDPOINT || '',
        config.AZURE_OPENAI_API_KEY || '',
        config.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
      ),
    };
  }
  return services;
}

export function resetServices(): void {
  services = null;
}
