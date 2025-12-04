import { z } from 'zod';

export const associationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.url().optional(),
});

export const updateAssociationSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});