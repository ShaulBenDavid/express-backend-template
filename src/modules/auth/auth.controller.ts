import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { AppError } from '../../errors/AppError.js';
import { CookieNameEnum } from '../../utils/cookieNames.js';
import { ms } from '../../utils/ms.js';
import { config } from '../../config/env.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

const REFRESH_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
};

// Scoped to /auth (not just /auth/refresh) so logout also receives it and can revoke it.
const REFRESH_COOKIE_PATH = '/api/v1/auth';

const REFRESH_COOKIE_OPTIONS = {
  ...REFRESH_COOKIE_BASE_OPTIONS,
  path: REFRESH_COOKIE_PATH,
  maxAge: ms('30d'),
};

export const googleSignIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body as { code: string };

    const { accessToken, refreshToken, user } = await authService.googleSignIn(code);

    res.cookie(CookieNameEnum.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(HttpStatusCode.OK).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies[CookieNameEnum.REFRESH_TOKEN] as string | undefined;
    if (!refreshToken) {
      throw new AppError('Refresh token missing', HttpStatusCode.UNAUTHORIZED);
    }

    const { accessToken, user } = await authService.refresh(refreshToken);
    res.status(HttpStatusCode.OK).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.revokeRefreshTokens(
      req.cookies[CookieNameEnum.REFRESH_TOKEN] as string | undefined,
    );
    res.clearCookie(CookieNameEnum.REFRESH_TOKEN, {
      ...REFRESH_COOKIE_BASE_OPTIONS,
      path: REFRESH_COOKIE_PATH,
    });
    res.status(HttpStatusCode.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
};
