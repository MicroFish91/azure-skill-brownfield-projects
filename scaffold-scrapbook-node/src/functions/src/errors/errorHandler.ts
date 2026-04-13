import type { InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';
import { AppError } from './AppError.js';
import { ZodError } from 'zod';
import { logger } from '../logger.js';

export function handleError(error: unknown, context: InvocationContext): HttpResponseInit {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error({ err: error, code: error.code }, error.message);
    }
    return {
      status: error.statusCode,
      jsonBody: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 422,
      jsonBody: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors,
        },
      },
    };
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  logger.error({ err: error }, 'Unhandled error');

  return {
    status: 500,
    jsonBody: {
      error: {
        code: 'INTERNAL_ERROR',
        message,
        details: null,
      },
    },
  };
}
