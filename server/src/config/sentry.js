const Sentry = require('@sentry/node');
const logger = require('./logger');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('SENTRY_DSN not set — Sentry disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    logger.info('Sentry initialized');
  } catch (err) {
    logger.warn({ error: err.message }, 'Failed to initialize Sentry');
  }
};

module.exports = { Sentry, initSentry };
