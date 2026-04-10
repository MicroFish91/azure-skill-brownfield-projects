import { getConfig, resetConfig } from '../../src/services/config';

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetConfig();
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    process.env.STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  });

  afterEach(() => {
    resetConfig();
    process.env = { ...originalEnv };
  });

  it('should load config correctly with all env vars set', () => {
    const config = getConfig();

    expect(config.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/testdb');
    expect(config.STORAGE_CONNECTION_STRING).toBe('UseDevelopmentStorage=true');
    expect(config.JWT_SECRET).toBe('test-secret-key-for-testing-only');
  });

  it('should include optional Azure OpenAI vars when set', () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://myendpoint.openai.azure.com';
    process.env.AZURE_OPENAI_API_KEY = 'my-api-key';
    process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o';

    const config = getConfig();

    expect(config.AZURE_OPENAI_ENDPOINT).toBe('https://myendpoint.openai.azure.com');
    expect(config.AZURE_OPENAI_API_KEY).toBe('my-api-key');
    expect(config.AZURE_OPENAI_DEPLOYMENT).toBe('gpt-4o');
  });

  it('should throw when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => getConfig()).toThrow('Missing required environment variables: DATABASE_URL');
  });

  it('should throw when STORAGE_CONNECTION_STRING is missing', () => {
    delete process.env.STORAGE_CONNECTION_STRING;
    expect(() => getConfig()).toThrow('Missing required environment variables: STORAGE_CONNECTION_STRING');
  });

  it('should throw when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => getConfig()).toThrow('Missing required environment variables: JWT_SECRET');
  });

  it('should throw listing all missing vars when multiple are missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    expect(() => getConfig()).toThrow('DATABASE_URL');
    resetConfig();
    delete process.env.STORAGE_CONNECTION_STRING;
    expect(() => getConfig()).toThrow('JWT_SECRET');
  });

  it('should cache result on subsequent calls', () => {
    const config1 = getConfig();
    const config2 = getConfig();
    expect(config1).toBe(config2);
  });

  it('should return fresh config after resetConfig', () => {
    const config1 = getConfig();
    resetConfig();
    process.env.JWT_SECRET = 'new-secret';
    const config2 = getConfig();
    expect(config2.JWT_SECRET).toBe('new-secret');
    expect(config1).not.toBe(config2);
  });
});
