import { PublicUser, Couple, Photo, Invite } from './entities';

// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export type RegisterResponse = AuthResponse;

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = AuthResponse;

export type MeResponse = PublicUser;

// Invites
export interface CreateInviteRequest {
  toEmail: string;
}

export type CreateInviteResponse = Invite;

export interface ListInvitesResponse {
  invites: Invite[];
}

export interface AcceptInviteResponse {
  invite: Invite;
  couple: Couple;
}

// Couple
export interface GetCoupleResponse {
  couple: Couple & { partner: PublicUser };
}

// Photos
export type UploadPhotoResponse = Photo;

export interface ListPhotosResponse {
  photos: Photo[];
  total: number;
}

export type GetPhotoResponse = Photo;

export interface DeletePhotoResponse {
  success: boolean;
}

// System
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    storage: boolean;
    aiCaption: boolean;
  };
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
