import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (_request, _context) => {
    const { database, storage, caption } = getServices();

    const checks: Record<string, boolean> = {};

    try { checks.database = await database.healthCheck(); } catch { checks.database = false; }
    try { checks.storage = await storage.healthCheck(); } catch { checks.storage = false; }
    try { checks.caption = await caption.healthCheck(); } catch { checks.caption = false; }

    const essentialHealthy = checks.database && checks.storage;
    const allHealthy = Object.values(checks).every((v) => v);

    const status = allHealthy ? 'healthy' : essentialHealthy ? 'degraded' : 'unhealthy';

    return {
      status: status === 'unhealthy' ? 503 : 200,
      jsonBody: { status, services: checks },
    };
  },
});
