import { createInviteSchema } from 'couplesnap-shared/schemas/invite';

describe('createInviteSchema', () => {
  it('should pass with valid email', () => {
    const result = createInviteSchema.safeParse({ toEmail: 'partner@example.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.toEmail).toBe('partner@example.com');
    }
  });

  it('should reject missing toEmail', () => {
    const result = createInviteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = createInviteSchema.safeParse({ toEmail: 'not-valid' });
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = createInviteSchema.safeParse({ toEmail: '' });
    expect(result.success).toBe(false);
  });
});
