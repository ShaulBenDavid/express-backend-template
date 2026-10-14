import type { Request, Response } from 'express';
import * as booksService from './books.service.js';
import type { CreateBookInput, UpdateBookInput } from './books.schema.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';
import { parseLimitParam, parsePositiveIntParam } from '../../utils/queryParams.js';

// `authenticate` runs on every books route, so req.user is always set here.
const currentUserId = (req: Request) => req.user!.id;

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;
  const page = parsePositiveIntParam(req.query['page']);
  const limit = parseLimitParam(req.query['limit']);
  const data = await booksService.getBooks(currentUserId(req), { search, page, limit });
  res.status(HttpStatusCode.OK).json({ status: 'ok', data });
};

export const getBookById = async (req: Request, res: Response): Promise<void> => {
  const data = await booksService.getBookById(currentUserId(req), req.params['id'] as string);
  res.status(HttpStatusCode.OK).json({ status: 'ok', data });
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  const data = await booksService.createBook(currentUserId(req), req.body as CreateBookInput);
  res.status(HttpStatusCode.CREATED).json({ status: 'ok', data });
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  const data = await booksService.updateBook(
    currentUserId(req),
    req.params['id'] as string,
    req.body as UpdateBookInput,
  );
  res.status(HttpStatusCode.OK).json({ status: 'ok', data });
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  const data = await booksService.deleteBook(currentUserId(req), req.params['id'] as string);
  res.status(HttpStatusCode.OK).json({ status: 'ok', data });
};
