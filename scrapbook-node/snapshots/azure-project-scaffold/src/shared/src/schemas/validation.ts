import { z } from 'zod';

// --- Path params ---

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const photoIdParamSchema = z.object({
  id: uuidSchema
});
export type PhotoIdParam = z.infer<typeof photoIdParamSchema>;

// --- Couple ---

export const inviteCodeSchema = z
  .string()
  .trim()
  .min(6, 'Invite code must be at least 6 characters')
  .max(32, 'Invite code is too long')
  .regex(/^[A-Za-z0-9-]+$/, 'Invite code must be alphanumeric');

export const pairCoupleSchema = z.object({
  inviteCode: inviteCodeSchema
});
export type PairCoupleRequest = z.infer<typeof pairCoupleSchema>;

// --- Photo upload ---

export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const photoUploadMetaSchema = z.object({
  contentType: z.enum(ALLOWED_PHOTO_MIME_TYPES, {
    errorMap: () => ({
      message: `contentType must be one of: ${ALLOWED_PHOTO_MIME_TYPES.join(', ')}`
    })
  }),
  size: z.number().int().positive().max(MAX_PHOTO_SIZE_BYTES, 'Photo too large')
});
export type PhotoUploadMeta = z.infer<typeof photoUploadMetaSchema>;
