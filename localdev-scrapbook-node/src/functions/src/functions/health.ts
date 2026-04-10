import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { logRequest } from '../middleware/requestLogger';

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const { database, storage, aiCaption } = getServices();

      const [dbHealth, storageHealth, aiHealth] = await Promise.allSettled([
        database.healthCheck(),
        storage.healthCheck(),
        aiCaption.healthCheck(),
      ]);

      const services = {
        database: dbHealth.status === 'fulfilled' && dbHealth.value,
        storage: storageHealth.status === 'fulfilled' && storageHealth.value,
        aiCaption: aiHealth.status === 'fulfilled' && aiHealth.value,
      };

      const allHealthy = services.database && services.storage && services.aiCaption;
      const anyHealthy = services.database || services.storage || services.aiCaption;

      const status = allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy';

      return {
        status: status === 'unhealthy' ? 503 : 200,
        jsonBody: {
          status,
          services,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
