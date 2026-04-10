import { HttpRequest, InvocationContext } from '@azure/functions';
import { createLogger } from '../logger';

const logger = createLogger('requestLogger');

export function logRequest(request: HttpRequest, context: InvocationContext, startTime: number): void {
  const duration = Date.now() - startTime;
  logger.info(
    {
      method: request.method,
      url: request.url,
      duration: `${duration}ms`,
      invocationId: context.invocationId,
    },
    `${request.method} ${request.url} completed in ${duration}ms`
  );
}
