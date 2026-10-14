import { z } from 'zod';

const MAX_YEAR = new Date().getFullYear() + 1;

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  author: z.string().trim().min(1, 'Author is required').max(255),
  description: z.string().max(2000).optional(),
  publishedYear: z.number().int().min(0).max(MAX_YEAR).optional(),
});

export const updateBookSchema = createBookSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  });

export const bookIdParamSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{1,64}$/i, 'Invalid book id'),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
