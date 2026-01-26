import { z } from 'zod';

export const adminSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(['SUPERADMIN', 'ADMIN']),
  // associationId: z.uuid(),
});

export const updateSchema = z.object({
  email: z.email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export const roleUpdateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['SUPERADMIN', 'ADMIN']),
});
