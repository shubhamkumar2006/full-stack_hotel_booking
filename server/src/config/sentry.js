const logger = require('./logger');

let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
  } catch (e) {
    logger.warn('Sentry package not loaded');
  }
}

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN || !Sentry) {
    return;
  }
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    logger.warn({ error: err.message }, 'Failed to initialize Sentry');
  }
};

module.exports = { Sentry, initSentry };
