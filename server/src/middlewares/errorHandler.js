const logger = require('../config/logger');

// ── Custom App Error ──────────────────────────────────────

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Global Error Handler ──────────────────────────────────

const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists';
    code = 'DUPLICATE_ENTRY';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    code = 'NOT_FOUND';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference — related record not found';
    code = 'INVALID_REFERENCE';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large (max 10 MB)';
    code = 'FILE_TOO_LARGE';
  }

  // Log
  if (statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url, userId: req.user?.id } }, message);
  } else {
    logger.warn({ statusCode, code, url: req.url }, message);
  }

  // Response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// ── 404 Handler ───────────────────────────────────────────
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.url} not found`, code: 'NOT_FOUND' },
  });
};

module.exports = { AppError, errorHandler, notFound };
