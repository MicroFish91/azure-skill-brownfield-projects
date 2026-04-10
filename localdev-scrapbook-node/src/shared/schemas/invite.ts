import { z } from 'zod';

export const createInviteSchema = z.object({
  toEmail: z.string().email('Invalid email address'),
});
