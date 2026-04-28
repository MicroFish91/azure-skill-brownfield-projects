import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { HealthResponse } from '@app/shared';
import { getServices } from '../services/registry';

async function healthHandler(
  _request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const { orderQueue, orderRepository } = getServices();

  const checks: Record<string, boolean> = {};
  try {
    checks.serviceBus = await orderQueue.healthCheck();
  } catch {
    checks.serviceBus = false;
  }
  try {
    checks.cosmos = await orderRepository.healthCheck();
  } catch {
    checks.cosmos = false;
  }

  const values = Object.values(checks);
  const allHealthy = values.every(Boolean);
  const anyHealthy = values.some(Boolean);
  const status: HealthResponse['status'] = allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy';

  const response: HealthResponse = { status, services: checks };
  // Per plan: healthy/degraded => 200, unhealthy => 503
  return { status: status === 'unhealthy' ? 503 : 200, jsonBody: response };
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: healthHandler,
});

export { healthHandler };
