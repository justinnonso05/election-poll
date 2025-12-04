import { z } from 'zod';

export const adminSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(['SUPERADMIN', 'ADMIN']),
  // associationId: z.uuid(),
});

export const updateSchema = z.object({
  email: z.email(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
});
