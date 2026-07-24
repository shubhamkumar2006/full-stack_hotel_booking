const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new AppError(message || 'Too many requests, please try again later', 429));
    },
  });

// General API limiter: 100 requests per 15 minutes
const apiLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  'Too many requests from this IP, please try again later'
);

// Auth limiter: 10 attempts per 15 minutes (prevents brute force)
const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again in 15 minutes'
);

// OTP limiter: 5 OTPs per hour
const otpLimiter = createRateLimiter(
  60 * 60 * 1000,
  5,
  'Too many OTP requests, please try again in an hour'
);

module.exports = { apiLimiter, authLimiter, otpLimiter };
