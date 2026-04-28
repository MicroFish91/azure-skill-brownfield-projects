export interface AppConfig {
  serviceBusConnectionString: string;
  serviceBusOrdersQueue: string;
  cosmosConnectionString: string;
  cosmosDatabase: string;
  cosmosContainer: string;
  nodeEnv: string;
}

const REQUIRED_VARS = [
  'SERVICE_BUS_CONNECTION_STRING',
  'SERVICE_BUS_ORDERS_QUEUE',
  'COSMOSDB_CONNECTION_STRING',
  'COSMOSDB_DATABASE',
  'COSMOSDB_CONTAINER',
] as const;

export function validateEnvironment(): string[] {
  return REQUIRED_VARS.filter((name) => !process.env[name]);
}

export function loadConfig(): AppConfig {
  const missing = validateEnvironment();
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Copy .env.example or update local.settings.json.`,
    );
  }

  return {
    serviceBusConnectionString: process.env.SERVICE_BUS_CONNECTION_STRING!,
    serviceBusOrdersQueue: process.env.SERVICE_BUS_ORDERS_QUEUE!,
    cosmosConnectionString: process.env.COSMOSDB_CONNECTION_STRING!,
    cosmosDatabase: process.env.COSMOSDB_DATABASE!,
    cosmosContainer: process.env.COSMOSDB_CONTAINER!,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}
