export interface AppConfig {
  DATABASE_URL: string;
  STORAGE_CONNECTION_STRING: string;
  JWT_SECRET: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_DEPLOYMENT?: string;
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const required = ['DATABASE_URL', 'STORAGE_CONNECTION_STRING', 'JWT_SECRET'] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please set them before starting the application.'
    );
  }

  cachedConfig = {
    DATABASE_URL: process.env.DATABASE_URL!,
    STORAGE_CONNECTION_STRING: process.env.STORAGE_CONNECTION_STRING!,
    JWT_SECRET: process.env.JWT_SECRET!,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
  };

  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}
