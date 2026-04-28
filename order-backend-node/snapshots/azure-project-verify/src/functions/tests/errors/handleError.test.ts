import { handleError } from '../../src/errors/handleError';
import {
  AppError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../../src/errors/AppError';
import { createMockContext } from '../mocks/http.mock';
import type { ErrorResponse } from '@app/shared';

describe('handleError', () => {
  it('maps ValidationError to 422', () => {
    const res = handleError(new ValidationError('bad'), createMockContext());
    expect(res.status).toBe(422);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('maps NotFoundError to 404 with resource details', () => {
    const res = handleError(new NotFoundError('Order', 'abc'), createMockContext());
    expect(res.status).toBe(404);
    const body = res.jsonBody as ErrorResponse;
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.details).toEqual({ resource: 'Order', id: 'abc' });
  });

  it('maps ServiceUnavailableError to 503', () => {
    const res = handleError(new ServiceUnavailableError('down'), createMockContext());
    expect(res.status).toBe(503);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('maps generic AppError using its status and code', () => {
    const res = handleError(
      new AppError('CONFLICT', 'duplicate', 409, { field: 'orderId' }),
      createMockContext(),
    );
    expect(res.status).toBe(409);
    const body = res.jsonBody as ErrorResponse;
    expect(body.error).toEqual({
      code: 'CONFLICT',
      message: 'duplicate',
      details: { field: 'orderId' },
    });
  });

  it('maps unknown errors to 500 INTERNAL_ERROR', () => {
    const res = handleError(new Error('kaboom'), createMockContext());
    expect(res.status).toBe(500);
    const body = res.jsonBody as ErrorResponse;
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('An unexpected error occurred');
    expect(body.error.details).toBeNull();
  });

  it('maps non-Error throwables to 500 INTERNAL_ERROR', () => {
    const res = handleError('a string', createMockContext());
    expect(res.status).toBe(500);
    expect((res.jsonBody as ErrorResponse).error.code).toBe('INTERNAL_ERROR');
  });
});
