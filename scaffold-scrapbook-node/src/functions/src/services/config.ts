export interface AppConfig {
  databaseUrl: string;
  storageConnectionString: string;
  jwtSecret: string;
  azureOpenAiEndpoint: string | undefined;
  azureOpenAiApiKey: string | undefined;
  nodeEnv: string;
}

const REQUIRED_VARS = ['DATABASE_URL', 'STORAGE_CONNECTION_STRING', 'JWT_SECRET'] as const;

export function validateEnvironment(): string[] {
  const missing: string[] = [];
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  return missing;
}

export function loadConfig(): AppConfig {
  const missing = validateEnvironment();
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\nCopy .env.example to .env and fill in the values.`
    );
  }

  return {
    databaseUrl: process.env.DATABASE_URL!,
    storageConnectionString: process.env.STORAGE_CONNECTION_STRING!,
    jwtSecret: process.env.JWT_SECRET!,
    azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}
