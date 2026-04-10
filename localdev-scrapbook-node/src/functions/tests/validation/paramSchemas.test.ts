import { uuidParamSchema } from 'couplesnap-shared/schemas/params';

describe('uuidParamSchema', () => {
  it('should pass with a valid UUID v4', () => {
    const result = uuidParamSchema.safeParse('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
    expect(result.success).toBe(true);
  });

  it('should pass with uppercase UUID', () => {
    const result = uuidParamSchema.safeParse('A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D');
    expect(result.success).toBe(true);
  });

  it('should reject invalid format', () => {
    const result = uuidParamSchema.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = uuidParamSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should reject random string', () => {
    const result = uuidParamSchema.safeParse('12345abcde');
    expect(result.success).toBe(false);
  });

  it('should reject UUID v1 format (wrong version digit)', () => {
    // UUID v1 has version 1 in the third group
    const result = uuidParamSchema.safeParse('a1b2c3d4-e5f6-1a7b-8c9d-0e1f2a3b4c5d');
    expect(result.success).toBe(false);
  });
});
