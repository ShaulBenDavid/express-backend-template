import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';
import type { CreateBookInput, UpdateBookInput } from './books.schema.js';

const BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  description: true,
  publishedYear: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Scoping by userId too means another user's book reads as 404, not 403 — no existence leak.
const getOwnedBookOrThrow = async (userId: string, id: string) => {
  const book = await prisma.book.findFirst({ where: { id, userId }, select: BOOK_SELECT });
  if (!book) {
    throw new AppError('Book not found', HttpStatusCode.NOT_FOUND);
  }
  return book;
};

export const getBooks = async (
  userId: string,
  filters: { search?: string; page?: number; limit?: number },
) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { author: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [rows, count] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: BOOK_SELECT,
    }),
    prisma.book.count({ where }),
  ]);

  const loadedCount = skip + rows.length;
  return {
    results: rows,
    count,
    next: loadedCount < count ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
  };
};

export const getBookById = (userId: string, id: string) => getOwnedBookOrThrow(userId, id);

export const createBook = (userId: string, data: CreateBookInput) =>
  prisma.book.create({ data: { ...data, userId }, select: BOOK_SELECT });

export const updateBook = async (userId: string, id: string, data: UpdateBookInput) => {
  await getOwnedBookOrThrow(userId, id);
  return prisma.book.update({ where: { id }, data, select: BOOK_SELECT });
};

export const deleteBook = async (userId: string, id: string) => {
  await getOwnedBookOrThrow(userId, id);
  await prisma.book.delete({ where: { id } });
  return { deleted: id };
};
