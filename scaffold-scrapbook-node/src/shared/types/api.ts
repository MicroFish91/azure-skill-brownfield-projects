import type { PublicUser, Couple, Photo } from './entities.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR';

export interface ErrorDetail {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface MeResponse {
  user: PublicUser;
}

export interface CoupleResponse {
  couple: Couple;
}

export interface CoupleDetailResponse {
  couple: Couple;
  users: PublicUser[];
}

export interface PhotoResponse {
  photo: Photo;
}

export interface ListPhotosResponse {
  photos: Photo[];
  total: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
}

export interface SuccessResponse {
  success: true;
}
