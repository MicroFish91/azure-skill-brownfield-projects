import { handleError } from '../../src/errors/errorHandler';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '../../src/errors/errorTypes';

describe('handleError', () => {
  it('should map NotFoundError to 404', () => {
    const result = handleError(new NotFoundError('Not found'));
    expect(result.status).toBe(404);
    expect(result.jsonBody).toEqual({
      error: { code: 'NOT_FOUND', message: 'Not found', details: undefined },
    });
  });

  it('should map ValidationError to 422', () => {
    const details = { email: ['Invalid email'] };
    const result = handleError(new ValidationError('Validation failed', details));
    expect(result.status).toBe(422);
    expect(result.jsonBody).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    });
  });

  it('should map ConflictError to 409', () => {
    const result = handleError(new ConflictError('Already exists'));
    expect(result.status).toBe(409);
    expect(result.jsonBody).toEqual({
      error: { code: 'CONFLICT', message: 'Already exists', details: undefined },
    });
  });

  it('should map UnauthorizedError to 401', () => {
    const result = handleError(new UnauthorizedError('Unauthorized'));
    expect(result.status).toBe(401);
    expect(result.jsonBody).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: undefined },
    });
  });

  it('should map ForbiddenError to 403', () => {
    const result = handleError(new ForbiddenError('Forbidden'));
    expect(result.status).toBe(403);
    expect(result.jsonBody).toEqual({
      error: { code: 'FORBIDDEN', message: 'Forbidden', details: undefined },
    });
  });

  it('should map BadRequestError to 400', () => {
    const result = handleError(new BadRequestError('Bad request'));
    expect(result.status).toBe(400);
    expect(result.jsonBody).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Bad request', details: undefined },
    });
  });

  it('should map generic Error to 500', () => {
    const result = handleError(new Error('Something went wrong'));
    expect(result.status).toBe(500);
    const body = result.jsonBody as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Something went wrong');
  });

  it('should have correct error response shape', () => {
    const result = handleError(new NotFoundError('Test not found', { id: '123' }));
    const body = result.jsonBody as { error: { code: string; message: string; details: unknown } };
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    expect(body.error).toHaveProperty('details');
    expect(body.error.details).toEqual({ id: '123' });
  });
});
