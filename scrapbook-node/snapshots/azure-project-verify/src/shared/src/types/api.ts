import type { User, Couple, Photo } from './entities.js';

// --- Error envelope ---

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

// --- Response shapes ---

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, { status: 'healthy' | 'unhealthy'; message?: string }>;
}

export interface MeResponse {
  user: User;
}

export interface CoupleResponse {
  couple: Couple;
}

export interface PhotoResponse {
  photo: Photo;
}

export interface PhotoListResponse {
  photos: Photo[];
}
