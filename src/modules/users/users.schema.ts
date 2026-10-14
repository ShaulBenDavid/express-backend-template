import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{1,64}$/i, 'Invalid user id'),
});
