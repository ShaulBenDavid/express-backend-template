function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';
const MIN_SECRET_LENGTH = 32;

const requireSecret = (key: string): string => {
  const value = requireEnv(key);
  if (isProduction && value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${key} must be at least ${MIN_SECRET_LENGTH} characters in production`);
  }
  return value;
};

const parseCorsOrigin = (): string | string[] => {
  const raw = process.env.CORS_ORIGIN ?? '*';
  if (isProduction && raw === '*') {
    console.warn('CORS_ORIGIN is not set — allowing any origin. Set it to the frontend URL.');
  }
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: requireEnv('DATABASE_URL'),
  corsOrigin: parseCorsOrigin(),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  googleRedirectUri: requireEnv('GOOGLE_REDIRECT_URI'),
  jwtAccessSecret: requireSecret('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '30', 10),
};
