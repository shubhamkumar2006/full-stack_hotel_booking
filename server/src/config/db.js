const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && !databaseUrl.includes('pgbouncer=true') && !databaseUrl.includes('statement_cache_size=0')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1`;
}

const prismaOptions = {
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
};

if (databaseUrl) {
  prismaOptions.datasources = {
    db: { url: databaseUrl },
  };
}

const prisma = new PrismaClient(prismaOptions);

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Prisma Query');
  });
}

prisma.$on('error', (e) => {
  logger.error({ message: e.message }, 'Prisma Error');
});

module.exports = prisma;
