import type { HttpResponseInit, InvocationContext } from '@azure/functions';
import { ZodError } from 'zod';
import type { ApiErrorResponse } from '@app/shared';
import { AppError } from '../errors/AppError.js';
import { logger } from '../lib/logger.js';

export function toErrorResponse(err: unknown, ctx?: InvocationContext): HttpResponseInit {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      error: { code: err.code, message: err.message, details: err.details }
    };
    return { status: err.status, jsonBody: body };
  }
  if (err instanceof ZodError) {
    const body: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten()
      }
    };
    return { status: 422, jsonBody: body };
  }
  const message = (err as Error)?.message ?? 'Unknown error';
  logger.error({ err: message, invocationId: ctx?.invocationId }, 'unhandled error');
  const body: ApiErrorResponse = {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  };
  return { status: 500, jsonBody: body };
}

/** Wrap an async handler so any throw becomes a structured error response. */
export function withErrors<T extends unknown[]>(
  fn: (...args: T) => Promise<HttpResponseInit>
): (...args: T) => Promise<HttpResponseInit> {
  return async (...args: T) => {
    const ctx = args[1] as InvocationContext | undefined;
    try {
      return await fn(...args);
    } catch (err) {
      return toErrorResponse(err, ctx);
    }
  };
}
