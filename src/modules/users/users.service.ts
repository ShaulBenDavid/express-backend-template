import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../errors/AppError.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  roles: true,
  createdAt: true,
} as const;

export const usersService = {
  async getAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: USER_PUBLIC_SELECT,
    });
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
    if (!user) {
      throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
    }
    return user;
  },

  async create(data: { name: string; email: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email already in use', HttpStatusCode.CONFLICT);
    }
    return prisma.user.create({ data, select: USER_PUBLIC_SELECT });
  },

  async deleteById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
    }
    return prisma.user.delete({ where: { id } });
  },
};
