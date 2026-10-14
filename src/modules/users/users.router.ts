import { Router } from 'express';
import { usersController } from './users.controller.js';
import { validateCreateUser } from './users.middleware.js';
import { authenticate, requireAdmin } from '../auth/auth.middleware.js';
import { validate } from '../../middleware/validate.js';
import { userIdParamSchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.use(authenticate, requireAdmin);

usersRouter.get('/', (req, res) => usersController.getAll(req, res));
usersRouter.get('/:id', validate(userIdParamSchema, 'params'), (req, res) =>
  usersController.getById(req, res),
);
usersRouter.post('/', validateCreateUser, (req, res) => usersController.create(req, res));
usersRouter.delete('/:id', validate(userIdParamSchema, 'params'), (req, res) =>
  usersController.deleteById(req, res),
);
