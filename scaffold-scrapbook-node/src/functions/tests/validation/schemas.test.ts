import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createCoupleSchema,
  uuidParamSchema,
} from 'scrapbook-shared';

describe('Zod Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should pass with valid data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123',
        displayName: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should fail when email is missing', () => {
      const result = registerSchema.safeParse({
        password: 'securepass123',
        displayName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when password is too short', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        displayName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when displayName is missing', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'securepass123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should pass with valid data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'anypassword',
      });
      expect(result.success).toBe(false);
    });

    it('should fail with empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createCoupleSchema', () => {
    it('should pass with valid email', () => {
      const result = createCoupleSchema.safeParse({
        partnerEmail: 'partner@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', () => {
      const result = createCoupleSchema.safeParse({
        partnerEmail: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('uuidParamSchema', () => {
    it('should pass with valid UUID', () => {
      const result = uuidParamSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should fail with invalid string', () => {
      const result = uuidParamSchema.safeParse({
        id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });
});
