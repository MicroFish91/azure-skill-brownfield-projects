import { z } from 'zod';

const configSchema = z.object({
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
  storageConnectionString: z.string().min(1, 'STORAGE_CONNECTION_STRING is required'),
  photoContainerName: z.string().min(1).default('photos'),
  entraTenantId: z.string().min(1, 'ENTRA_TENANT_ID is required'),
  entraClientId: z.string().min(1, 'ENTRA_CLIENT_ID is required'),
  entraApiAudience: z.string().min(1, 'ENTRA_API_AUDIENCE is required'),
  azureOpenAiEndpoint: z.string().optional(),
  azureOpenAiApiKey: z.string().optional(),
  azureOpenAiDeployment: z.string().default('gpt-4o'),
  azureOpenAiApiVersion: z.string().default('2024-08-01-preview'),
  logLevel: z.string().default('info'),
  nodeEnv: z.string().default('development')
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = configSchema.safeParse({
    databaseUrl: env.DATABASE_URL,
    storageConnectionString: env.STORAGE_CONNECTION_STRING,
    photoContainerName: env.PHOTO_CONTAINER_NAME,
    entraTenantId: env.ENTRA_TENANT_ID,
    entraClientId: env.ENTRA_CLIENT_ID,
    entraApiAudience: env.ENTRA_API_AUDIENCE,
    azureOpenAiEndpoint: env.AZURE_OPENAI_ENDPOINT,
    azureOpenAiApiKey: env.AZURE_OPENAI_API_KEY,
    azureOpenAiDeployment: env.AZURE_OPENAI_DEPLOYMENT,
    azureOpenAiApiVersion: env.AZURE_OPENAI_API_VERSION,
    logLevel: env.LOG_LEVEL,
    nodeEnv: env.NODE_ENV
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid configuration: ${issues}`);
  }
  return parsed.data;
}

export function isAzureOpenAiConfigured(cfg: AppConfig): boolean {
  return Boolean(cfg.azureOpenAiEndpoint && cfg.azureOpenAiApiKey && cfg.azureOpenAiDeployment);
}
