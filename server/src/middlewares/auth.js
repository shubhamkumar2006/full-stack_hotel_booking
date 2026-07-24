const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { AppError } = require('./errorHandler');

// ── Verify JWT access token ───────────────────────────────

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
      avatar: true,
    },
  });

  if (!user) throw new AppError('User not found', 401);
  if (!user.isActive) throw new AppError('Account deactivated', 403);

  req.user = user;
  next();
};

// ── Role-based access guards ──────────────────────────────

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) throw new AppError('Not authenticated', 401);
    if (!roles.includes(req.user.role)) {
      throw new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403);
    }
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    throw new AppError('Please verify your email/phone first', 403);
  }
  next();
};

module.exports = { authenticate, requireRole, requireVerified };
