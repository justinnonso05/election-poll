import { z } from 'zod';

export const updateVoterSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.email().optional(),
  level: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  regeneratePassword: z.boolean().optional(),
});

export const voterSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.email(),
  level: z.string().min(1),
  studentId: z.string().min(1),
});
