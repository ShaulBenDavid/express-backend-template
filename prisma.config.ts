import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  adapter: () => {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('Missing DATABASE_URL');
    }
    return Promise.resolve(new PrismaPg(connectionString));
  },
});
