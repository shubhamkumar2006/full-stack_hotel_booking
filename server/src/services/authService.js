const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const { setWithTTL, getKey, deleteKey } = require('../config/redis');
const notificationService = require('./notificationService');
const logger = require('../config/logger');
const { AppError } = require('../middlewares/errorHandler');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

// ── Token helpers ─────────────────────────────────────────

const generateAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const generateRefreshToken = () => {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
};

// ── OTP helpers ───────────────────────────────────────────

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hash };
};

const verifyOtpHash = (otp, hash) => {
  const incoming = crypto.createHash('sha256').update(otp).digest('hex');
  return incoming === hash;
};

// ── Signup ────────────────────────────────────────────────

const signup = async ({ name, email, password, phone, role = 'GUEST' }, res) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role, isVerified: true },
    select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, avatar: true },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const { token: refreshToken, hash: tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  if (res) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  logger.info({ userId: user.id, email }, 'User created and logged in automatically without OTP');

  return {
    accessToken,
    user,
  };
};

// ── Verify OTP ────────────────────────────────────────────

const verifyOtp = async ({ userId, otp, purpose = 'signup' }, res) => {
  const record = await prisma.otpVerification.findFirst({
    where: { userId, purpose, verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw new AppError('OTP not found or already used', 400);
  if (new Date() > record.expiresAt) throw new AppError('OTP expired', 400);
  if (!verifyOtpHash(otp, record.otpHash)) throw new AppError('Invalid OTP', 400);

  const [, user] = await prisma.$transaction([
    prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);

  logger.info({ userId, purpose }, 'OTP verified');

  if (purpose === 'signup') {
    const accessToken = generateAccessToken(user.id, user.role);
    const { token: refreshToken, hash: tokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    if (res) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });
    }

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
    };
  }

  return true;
};

// ── Login ─────────────────────────────────────────────────

const login = async ({ email, password }, res) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) throw new AppError('Invalid credentials', 401);

  const accessToken = generateAccessToken(user.id, user.role);
  const { token: refreshToken, hash: tokenHash } = generateRefreshToken();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  logger.info({ userId: user.id, email }, 'User logged in');

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
    },
  };
};

// ── Refresh Access Token ──────────────────────────────────

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) throw new AppError('No refresh token', 401);

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || new Date() > stored.expiresAt) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (!stored.user.isActive) throw new AppError('Account deactivated', 403);

  // Rotate refresh token
  const { token: newRefreshToken, hash: newHash } = generateRefreshToken();
  const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: { userId: stored.userId, tokenHash: newHash, expiresAt: newExpiry },
    }),
  ]);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  const accessToken = generateAccessToken(stored.userId, stored.user.role);
  return { accessToken };
};

// ── Logout ────────────────────────────────────────────────

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

// ── Forgot Password ───────────────────────────────────────

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond positively to prevent email enumeration
  if (!user) return true;

  const { otp, hash } = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: { userId: user.id, contact: email, otpHash: hash, purpose: 'reset_password', expiresAt },
  });

  await notificationService.sendPasswordResetEmail(email, user.name, otp);

  logger.info({ email, otp: process.env.NODE_ENV === 'development' ? otp : undefined }, 'Password reset OTP sent');
  return true;
};

// ── Reset Password ────────────────────────────────────────

const resetPassword = async ({ email, otp, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid reset request', 400);

  const record = await prisma.otpVerification.findFirst({
    where: { userId: user.id, purpose: 'reset_password', verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record || new Date() > record.expiresAt) throw new AppError('OTP expired', 400);
  if (!verifyOtpHash(otp, record.otpHash)) throw new AppError('Invalid OTP', 400);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } }),
    // Invalidate all refresh tokens on password reset
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);

  logger.info({ userId: user.id }, 'Password reset successfully');
  return true;
};

// ── Phone Login Request ────────────────────────────────────
const loginPhoneRequest = async ({ phone }) => {
  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user || !user.isActive) {
    throw new AppError('Phone number not registered or account inactive', 404);
  }

  const { otp, hash } = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: {
      userId: user.id,
      contact: phone,
      otpHash: hash,
      purpose: 'phone_login',
      expiresAt,
    },
  });

  // Log to console for development testing
  logger.info({ phone, otp }, 'Phone login OTP generated');

  // Send SMS
  await notificationService.sendSms(phone, `Your StayNest login OTP is ${otp}. Valid for 10 minutes.`);

  return {
    message: 'OTP sent successfully',
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  };
};

// ── Phone Login Verify ─────────────────────────────────────
const loginPhoneVerify = async ({ phone, otp }, res) => {
  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user || !user.isActive) {
    throw new AppError('Phone number not registered or account inactive', 404);
  }

  const record = await prisma.otpVerification.findFirst({
    where: { userId: user.id, purpose: 'phone_login', verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw new AppError('OTP not found or already used', 400);
  if (new Date() > record.expiresAt) throw new AppError('OTP expired', 400);
  if (!verifyOtpHash(otp, record.otpHash)) throw new AppError('Invalid OTP', 400);

  // Mark OTP as verified and user verified
  await prisma.$transaction([
    prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } }),
    prisma.user.update({ where: { id: user.id }, data: { isVerified: true } }),
  ]);

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const { token: refreshToken, hash: tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });

  logger.info({ userId: user.id, phone }, 'User logged in via phone OTP');

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
    },
  };
};

module.exports = {
  signup,
  verifyOtp,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  loginPhoneRequest,
  loginPhoneVerify,
};
