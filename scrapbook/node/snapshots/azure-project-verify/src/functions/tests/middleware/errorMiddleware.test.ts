import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/errors/AppError.js';
import { toErrorResponse } from '../../src/middleware/errorMiddleware.js';
import { ZodError, z } from 'zod';

describe('AppError factories', () => {
  it.each([
    ['validation',         () => AppError.validation('bad'),         422, 'VALIDATION_ERROR'],
    ['badRequest',         () => AppError.badRequest('bad'),         400, 'BAD_REQUEST'],
    ['unauthorized',       () => AppError.unauthorized(),            401, 'UNAUTHORIZED'],
    ['forbidden',          () => AppError.forbidden(),               403, 'FORBIDDEN'],
    ['notFound',           () => AppError.notFound(),                404, 'NOT_FOUND'],
    ['conflict',           () => AppError.conflict('dup'),           409, 'CONFLICT'],
    ['serviceUnavailable', () => AppError.serviceUnavailable('out'), 503, 'SERVICE_UNAVAILABLE'],
    ['internal',           () => AppError.internal(),                500, 'INTERNAL_ERROR']
  ] as const)('factory %s sets status and code', (_name, factory, status, code) => {
    const err = factory();
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
  });
});

describe('toErrorResponse', () => {
  it('maps AppError to its envelope', () => {
    const r = toErrorResponse(AppError.notFound('nope'));
    expect(r.status).toBe(404);
    expect(r.jsonBody).toEqual({
      error: { code: 'NOT_FOUND', message: 'nope', details: undefined }
    });
  });

  it('maps ZodError to a 422 VALIDATION_ERROR envelope', () => {
    let zErr: ZodError | null = null;
    try { z.object({ x: z.string() }).parse({}); }
    catch (e) { zErr = e as ZodError; }
    const r = toErrorResponse(zErr!);
    expect(r.status).toBe(422);
    const body = r.jsonBody as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps unknown errors to 500 INTERNAL_ERROR (no leak)', () => {
    const r = toErrorResponse(new Error('secret stack trace'));
    expect(r.status).toBe(500);
    const body = r.jsonBody as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('secret');
  });
});
