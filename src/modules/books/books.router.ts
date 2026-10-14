import { Router } from 'express';
import * as booksController from './books.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { createBookSchema, updateBookSchema, bookIdParamSchema } from './books.schema.js';

export const booksRouter = Router();

booksRouter.use(authenticate);

booksRouter.get('/', (req, res) => booksController.getBooks(req, res));
booksRouter.get('/:id', validate(bookIdParamSchema, 'params'), (req, res) =>
  booksController.getBookById(req, res),
);
booksRouter.post('/', validate(createBookSchema), (req, res) =>
  booksController.createBook(req, res),
);
booksRouter.put(
  '/:id',
  validate(bookIdParamSchema, 'params'),
  validate(updateBookSchema),
  (req, res) => booksController.updateBook(req, res),
);
booksRouter.delete('/:id', validate(bookIdParamSchema, 'params'), (req, res) =>
  booksController.deleteBook(req, res),
);
