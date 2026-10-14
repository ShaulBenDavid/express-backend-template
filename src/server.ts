import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './lib/prisma.js';

function main() {
  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });

  function shutdown(signal: string) {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      void prisma.$disconnect().then(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
  }

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

main();
