import { describe, it, expect } from 'vitest';
import {
  pairCoupleSchema,
  photoIdParamSchema,
  photoUploadMetaSchema,
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES
} from '@app/shared';

describe('pairCoupleSchema', () => {
  it('accepts a valid 8-char alphanumeric invite code', () => {
    const r = pairCoupleSchema.safeParse({ inviteCode: 'ABCDEF12' });
    expect(r.success).toBe(true);
  });

  it('rejects when inviteCode is missing', () => {
    const r = pairCoupleSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('rejects codes shorter than 6 characters', () => {
    const r = pairCoupleSchema.safeParse({ inviteCode: 'AB12' });
    expect(r.success).toBe(false);
  });

  it('rejects codes longer than 32 characters', () => {
    const r = pairCoupleSchema.safeParse({ inviteCode: 'A'.repeat(33) });
    expect(r.success).toBe(false);
  });

  it('rejects codes with non-alphanumeric characters', () => {
    const r = pairCoupleSchema.safeParse({ inviteCode: 'ABC@123!' });
    expect(r.success).toBe(false);
  });

  it('trims surrounding whitespace', () => {
    const r = pairCoupleSchema.safeParse({ inviteCode: '  GOODCODE  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.inviteCode).toBe('GOODCODE');
  });
});

describe('photoIdParamSchema', () => {
  it('accepts a valid uuid', () => {
    const r = photoIdParamSchema.safeParse({ id: '11111111-1111-1111-1111-111111111111' });
    expect(r.success).toBe(true);
  });

  it('rejects a malformed uuid', () => {
    const r = photoIdParamSchema.safeParse({ id: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('rejects when id is missing', () => {
    const r = photoIdParamSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

describe('photoUploadMetaSchema', () => {
  it.each(ALLOWED_PHOTO_MIME_TYPES)('accepts allowed MIME type %s', (mime) => {
    const r = photoUploadMetaSchema.safeParse({ contentType: mime, size: 1024 });
    expect(r.success).toBe(true);
  });

  it('rejects unsupported MIME types', () => {
    const r = photoUploadMetaSchema.safeParse({
      contentType: 'application/pdf',
      size: 1024
    });
    expect(r.success).toBe(false);
  });

  it('rejects zero-byte uploads', () => {
    const r = photoUploadMetaSchema.safeParse({ contentType: 'image/jpeg', size: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects uploads above the size limit', () => {
    const r = photoUploadMetaSchema.safeParse({
      contentType: 'image/jpeg',
      size: MAX_PHOTO_SIZE_BYTES + 1
    });
    expect(r.success).toBe(false);
  });

  it('accepts uploads exactly at the size limit', () => {
    const r = photoUploadMetaSchema.safeParse({
      contentType: 'image/jpeg',
      size: MAX_PHOTO_SIZE_BYTES
    });
    expect(r.success).toBe(true);
  });
});
