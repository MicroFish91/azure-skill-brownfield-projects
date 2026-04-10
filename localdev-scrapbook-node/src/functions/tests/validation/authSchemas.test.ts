import { registerSchema, loginSchema } from 'couplesnap-shared/schemas/auth';

describe('registerSchema', () => {
  it('should pass with valid data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.password).toBe('password123');
      expect(result.data.displayName).toBe('Test User');
    }
  });

  it('should reject missing email', () => {
    const result = registerSchema.safeParse({
      password: 'password123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password (less than 8 characters)', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      displayName: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing displayName', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty displayName', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      displayName: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should pass with valid data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.password).toBe('password123');
    }
  });

  it('should reject missing email', () => {
    const result = loginSchema.safeParse({
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
