import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

const googleClient = new OAuth2Client(
  config.googleClientId,
  config.googleClientSecret,
  config.googleRedirectUri,
);

export interface JwtAccessPayload {
  sub: string;
  email: string;
  roles: Role[];
}

export interface JwtRefreshPayload {
  sub: string;
  tv?: number;
}

const JWT_ALGORITHM = 'HS256' as const;

const signAccessToken = (user: { id: string; email: string; roles: Role[] }) =>
  jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles } satisfies JwtAccessPayload,
    config.jwtAccessSecret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: config.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
    },
  );

const signRefreshToken = (user: { id: string; tokenVersion: number }) =>
  jwt.sign(
    { sub: user.id, tv: user.tokenVersion } satisfies JwtRefreshPayload,
    config.jwtRefreshSecret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
    },
  );

const verifyRefreshToken = (refreshToken: string): JwtRefreshPayload | null => {
  try {
    return jwt.verify(refreshToken, config.jwtRefreshSecret, {
      algorithms: [JWT_ALGORITHM],
    }) as JwtRefreshPayload;
  } catch {
    return null;
  }
};

const googleSignIn = async (code: string) => {
  const { tokens } = await googleClient.getToken(code);
  const idToken = tokens.id_token;
  if (!idToken) {
    throw new AppError('No ID token returned from Google', HttpStatusCode.UNAUTHORIZED);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AppError('Invalid Google token payload', HttpStatusCode.UNAUTHORIZED);
  }
  if (payload.email_verified !== true) {
    throw new AppError('Google email is not verified', HttpStatusCode.UNAUTHORIZED);
  }

  const { sub: googleId, email, name = '', picture } = payload;

  // Email match only links accounts that were never bound to a Google identity.
  let user =
    (await prisma.user.findUnique({ where: { googleId } })) ??
    (await prisma.user.findFirst({ where: { email, googleId: null } }));

  if (user) {
    if (!user.googleId || user.picture !== picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, picture },
      });
    }
  } else {
    user = await prisma.user.create({
      data: { googleId, email, name, picture },
    });
  }

  const accessToken = signAccessToken(user);

  const refreshToken = signRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      roles: user.roles,
    },
  };
};

const refresh = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new AppError('Invalid or expired refresh token', HttpStatusCode.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  // Tokens issued before tokenVersion existed carry no `tv` and count as version 0.
  if (!user || (payload.tv ?? 0) !== user.tokenVersion) {
    throw new AppError('Invalid or expired refresh token', HttpStatusCode.UNAUTHORIZED);
  }

  const accessToken = signAccessToken(user);

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      roles: user.roles,
    },
  };
};

const revokeRefreshTokens = async (refreshToken: string | undefined) => {
  const payload = refreshToken ? verifyRefreshToken(refreshToken) : null;
  if (!payload) {
    return;
  }
  await prisma.user.updateMany({
    where: { id: payload.sub, tokenVersion: payload.tv ?? 0 },
    data: { tokenVersion: { increment: 1 } },
  });
};

export const authService = {
  googleSignIn,
  refresh,
  revokeRefreshTokens,
};
