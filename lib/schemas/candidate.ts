import { z } from 'zod';

export const candidateSchema = z.object({
  name: z.string().min(1, 'Candidate name is required'),
  manifesto: z.string().optional(),
  photoUrl: z.url().optional(),
  electionId: z.string().min(1, 'Election is required'),
  positionId: z.string().min(1, 'Position is required'),
});

export const updateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  manifesto: z.string().optional(),
  photoUrl: z.url().optional(),
  positionId: z.string().optional(),
});
