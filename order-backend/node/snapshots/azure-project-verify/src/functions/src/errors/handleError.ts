import type { HttpResponseInit, InvocationContext } from '@azure/functions';
import { ZodError } from 'zod';
import type { ErrorResponse } from '@app/shared';
import { AppError } from './AppError';
import { getLogger } from '../logger';

const log = getLogger('error');

export function handleError(error: unknown, context: InvocationContext): HttpResponseInit {
  if (error instanceof ZodError) {
    const body: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.flatten(),
      },
    };
    return { status: 422, jsonBody: body };
  }

  if (error instanceof AppError) {
    const body: ErrorResponse = {
      error: { code: error.code, message: error.message, details: error.details },
    };
    return { status: error.status, jsonBody: body };
  }

  log.error(
    { err: error, invocationId: context.invocationId, function: context.functionName },
    'unhandled error',
  );

  const body: ErrorResponse = {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: null },
  };
  return { status: 500, jsonBody: body };
}
