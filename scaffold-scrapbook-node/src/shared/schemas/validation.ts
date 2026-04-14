import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createCoupleSchema = z.object({
  partnerEmail: z.string().email('Invalid partner email address'),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const fileUploadSchema = z.object({
  maxSizeBytes: z.number().default(10 * 1024 * 1024), // 10MB
  allowedMimeTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateCoupleRequest = z.infer<typeof createCoupleSchema>;
