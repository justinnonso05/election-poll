import { z } from 'zod';

export const positionSchema = z.object({
  name: z.string().min(1, 'Position name is required'),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  maxCandidates: z.number().int().min(1).default(10),
});

export const updatePositionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  maxCandidates: z.number().int().min(1).optional(),
});