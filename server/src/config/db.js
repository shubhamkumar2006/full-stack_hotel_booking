const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Prisma Query');
  });
}

prisma.$on('error', (e) => {
  logger.error({ message: e.message }, 'Prisma Error');
});

module.exports = prisma;
