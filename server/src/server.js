require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const prisma = require('./config/db');
const { redis } = require('./config/redis');

const PORT = parseInt(process.env.PORT) || 5000;

const start = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Test Redis connection
    await redis.connect().catch(() => {}); // ioredis auto-connects; this is a no-op if already connected
    logger.info('Redis connected');

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'StayNest API server started');
    });

    // ── Graceful Shutdown ─────────────────────────────────
    const shutdown = async (signal) => {
      logger.info({ signal }, 'Received shutdown signal');
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        logger.info('Server shut down gracefully');
        process.exit(0);
      });

      // Force close after 30s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception — shutting down');
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      logger.fatal({ reason }, 'Unhandled rejection — shutting down');
      process.exit(1);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
