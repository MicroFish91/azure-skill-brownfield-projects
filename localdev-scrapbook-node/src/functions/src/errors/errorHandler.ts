import { HttpResponseInit } from '@azure/functions';
import { AppError } from './AppError';
import { createLogger } from '../logger';

const logger = createLogger('errorHandler');

export function handleError(error: unknown): HttpResponseInit {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      jsonBody: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  logger.error({ err: error }, 'Unhandled error');

  return {
    status: 500,
    jsonBody: {
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction ? 'An unexpected error occurred' : message,
        details: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
      },
    },
  };
}
