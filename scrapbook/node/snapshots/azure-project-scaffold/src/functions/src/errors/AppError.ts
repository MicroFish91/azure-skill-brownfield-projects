import type { ErrorCode } from '@app/shared';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static validation(message: string, details?: unknown) {
    return new AppError('VALIDATION_ERROR', message, 422, details);
  }
  static badRequest(message: string, details?: unknown) {
    return new AppError('BAD_REQUEST', message, 400, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError('FORBIDDEN', message, 403);
  }
  static notFound(message = 'Not found') {
    return new AppError('NOT_FOUND', message, 404);
  }
  static conflict(message: string, details?: unknown) {
    return new AppError('CONFLICT', message, 409, details);
  }
  static serviceUnavailable(message: string) {
    return new AppError('SERVICE_UNAVAILABLE', message, 503);
  }
  static internal(message = 'Internal server error') {
    return new AppError('INTERNAL_ERROR', message, 500);
  }
}
