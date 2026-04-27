import { describe, it, expect } from 'vitest';
import { loadConfig, isAzureOpenAiConfigured } from '../../src/services/config.js';

describe('loadConfig', () => {
  it('parses a valid environment', () => {
    const cfg = loadConfig({
      DATABASE_URL: 'postgresql://x@y/z',
      STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true',
      ENTRA_TENANT_ID: 't',
      ENTRA_CLIENT_ID: 'c',
      ENTRA_API_AUDIENCE: 'a'
    } as NodeJS.ProcessEnv);
    expect(cfg.databaseUrl).toBe('postgresql://x@y/z');
    expect(cfg.photoContainerName).toBe('photos'); // default
    expect(cfg.azureOpenAiDeployment).toBe('gpt-4o'); // default
  });

  it('throws when required vars are missing', () => {
    expect(() =>
      loadConfig({ DATABASE_URL: 'x' } as NodeJS.ProcessEnv)
    ).toThrow(/Invalid configuration/);
  });
});

describe('isAzureOpenAiConfigured', () => {
  const base = {
    databaseUrl: 'x',
    storageConnectionString: 'x',
    photoContainerName: 'photos',
    entraTenantId: 't',
    entraClientId: 'c',
    entraApiAudience: 'a',
    azureOpenAiDeployment: 'gpt-4o',
    azureOpenAiApiVersion: '2024-08-01-preview',
    logLevel: 'info',
    nodeEnv: 'test'
  };

  it('returns false when endpoint and key are missing', () => {
    expect(isAzureOpenAiConfigured(base)).toBe(false);
  });

  it('returns true when endpoint, key, and deployment are set', () => {
    expect(
      isAzureOpenAiConfigured({
        ...base,
        azureOpenAiEndpoint: 'https://x.openai.azure.com',
        azureOpenAiApiKey: 'sk-xxx'
      })
    ).toBe(true);
  });
});
