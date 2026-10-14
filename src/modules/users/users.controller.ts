import type { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

export const usersController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    const users = await usersService.getAll();
    res.status(HttpStatusCode.OK).json({ status: 'ok', data: users });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const user = await usersService.getById(req.params['id'] as string);
    res.status(HttpStatusCode.OK).json({ status: 'ok', data: user });
  },

  async create(req: Request, res: Response): Promise<void> {
    const user = await usersService.create(req.body as { name: string; email: string });
    res.status(HttpStatusCode.CREATED).json({ status: 'ok', data: user });
  },

  async deleteById(req: Request, res: Response): Promise<void> {
    await usersService.deleteById(req.params['id'] as string);
    res.status(HttpStatusCode.NO_CONTENT).send();
  },
};
