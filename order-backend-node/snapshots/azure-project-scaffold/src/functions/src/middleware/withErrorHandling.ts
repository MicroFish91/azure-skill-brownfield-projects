import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { handleError } from '../errors/handleError';
import { getLogger } from '../logger';

const log = getLogger('http');

export type WrappedHandler = (
  request: HttpRequest,
  context: InvocationContext,
) => Promise<HttpResponseInit>;

export function withErrorHandling(handler: WrappedHandler): WrappedHandler {
  return async (request, context) => {
    const start = Date.now();
    try {
      const response = await handler(request, context);
      log.info(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: response.status ?? 200,
          durationMs: Date.now() - start,
          invocationId: context.invocationId,
        },
        'request completed',
      );
      return response;
    } catch (error) {
      const response = handleError(error, context);
      log.warn(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: response.status,
          durationMs: Date.now() - start,
          invocationId: context.invocationId,
        },
        'request failed',
      );
      return response;
    }
  };
}
