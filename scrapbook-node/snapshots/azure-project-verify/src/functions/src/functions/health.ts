import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { HealthResponse } from '@app/shared';
import { getServices } from '../services/registry.js';
import { isAzureOpenAiConfigured } from '../services/config.js';
import { withErrors } from '../middleware/errorMiddleware.js';

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    return { name, status: 'healthy' as const };
  } catch (err) {
    return { name, status: 'unhealthy' as const, message: (err as Error).message };
  }
}

export const healthHandler = withErrors(
  async (_req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
    const services = getServices();

    const [db, blob, captionPing] = await Promise.all([
      check('postgres', () => services.users.ping()),
      check('blob', () => services.blob.ping()),
      services.captions.ping().catch((err: unknown) => ({
        available: false,
        message: (err as Error).message
      }))
    ]);

    const captionConfigured = isAzureOpenAiConfigured(services.config);
    const captionStatus = captionPing.available ? 'healthy' : 'unhealthy';

    const body: HealthResponse = {
      status: 'healthy',
      services: {
        postgres: { status: db.status, message: 'message' in db ? db.message : undefined },
        blob: { status: blob.status, message: 'message' in blob ? blob.message : undefined },
        captions: {
          status: captionStatus,
          message: captionPing.message ?? (captionConfigured ? undefined : 'fallback mode')
        }
      }
    };

    const essentialsHealthy = db.status === 'healthy' && blob.status === 'healthy';
    const enhancementHealthy = captionStatus === 'healthy';

    if (!essentialsHealthy) {
      body.status = 'unhealthy';
      return { status: 503, jsonBody: body };
    }
    if (!enhancementHealthy) {
      body.status = 'degraded';
      return { status: 200, jsonBody: body };
    }
    return { status: 200, jsonBody: body };
  }
);

app.http('health', {
  route: 'health',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: healthHandler
});
