import type { ErrorCode } from '@app/shared';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown | null;

  constructor(code: ErrorCode, message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: unknown = null) {
    super('VALIDATION_ERROR', message, 422, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} '${id}' not found`, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, details: unknown = null) {
    super('SERVICE_UNAVAILABLE', message, 503, details);
    this.name = 'ServiceUnavailableError';
  }
}
