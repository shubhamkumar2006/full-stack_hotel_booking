const logger = require('./logger');

const Sentry = {
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    tracingHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
  init: () => {},
};

const initSentry = (app) => {
  logger.info('Sentry disabled (no DSN configured)');
};

module.exports = { Sentry, initSentry };
