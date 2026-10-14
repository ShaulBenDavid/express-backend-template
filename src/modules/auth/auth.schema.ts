import { z } from 'zod';

export const googleSignInSchema = z.object({
  code: z.string().min(1).max(2048),
});
