const Sentry = require('@sentry/node');
const logger = require('./logger');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('SENTRY_DSN not set — Sentry disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
  });

  logger.info('Sentry initialized');
};

module.exports = { Sentry, initSentry };
