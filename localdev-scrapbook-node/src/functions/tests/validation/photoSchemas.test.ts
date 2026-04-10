import { uploadPhotoSchema, listPhotosQuerySchema } from 'couplesnap-shared/schemas/photo';

describe('uploadPhotoSchema', () => {
  it('should pass with caption', () => {
    const result = uploadPhotoSchema.safeParse({ caption: 'Our first date!' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.caption).toBe('Our first date!');
    }
  });

  it('should pass without caption (optional)', () => {
    const result = uploadPhotoSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.caption).toBeUndefined();
    }
  });

  it('should pass with empty object', () => {
    const result = uploadPhotoSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('listPhotosQuerySchema', () => {
  it('should apply default values', () => {
    const result = listPhotosQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('should accept custom limit and offset', () => {
    const result = listPhotosQuerySchema.safeParse({ limit: '10', offset: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(5);
    }
  });

  it('should coerce string numbers', () => {
    const result = listPhotosQuerySchema.safeParse({ limit: '50', offset: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(20);
    }
  });

  it('should reject limit above 100', () => {
    const result = listPhotosQuerySchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });

  it('should reject limit below 1', () => {
    const result = listPhotosQuerySchema.safeParse({ limit: '0' });
    expect(result.success).toBe(false);
  });

  it('should reject negative offset', () => {
    const result = listPhotosQuerySchema.safeParse({ offset: '-1' });
    expect(result.success).toBe(false);
  });
});
