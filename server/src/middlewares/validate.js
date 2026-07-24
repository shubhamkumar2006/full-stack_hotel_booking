const { validationResult, body, param, query } = require('express-validator');
const { AppError } = require('./errorHandler');

// ── Run validation and throw on errors ───────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join(', ');
    throw new AppError(`Validation error: ${messages}`, 422);
  }
  next();
};

// ── Reusable validation chains ────────────────────────────

const authValidators = {
  signup: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('role').optional().isIn(['GUEST', 'HOST']).withMessage('Role must be GUEST or HOST'),
  ],
  login: [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginPhoneRequest: [
    body('phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone().withMessage('Invalid phone number'),
  ],
  loginPhoneVerify: [
    body('phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone().withMessage('Invalid phone number'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  verifyOtp: [
    body('userId').notEmpty().withMessage('User ID required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('purpose').optional().isString(),
  ],
  forgotPassword: [body('email').isEmail().withMessage('Valid email required').normalizeEmail()],
  resetPassword: [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
  ],
};

const bookingValidators = {
  create: [
    body('roomId').notEmpty().withMessage('Room ID required'),
    body('checkIn').isISO8601().withMessage('Valid check-in date required'),
    body('checkOut').isISO8601().withMessage('Valid check-out date required'),
    body('guestsCount').isInt({ min: 1 }).withMessage('At least 1 guest required'),
  ],
};

const reviewValidators = {
  create: [
    body('bookingId').notEmpty().withMessage('Booking ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
    body('comment').trim().isLength({ min: 10, max: 2000 }).withMessage('Comment must be 10–2000 chars'),
  ],
};

const propertyValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Property name required').isLength({ max: 200 }),
    body('description').trim().notEmpty().withMessage('Description required'),
    body('address').trim().notEmpty().withMessage('Address required'),
    body('city').trim().notEmpty().withMessage('City required'),
    body('cancellationPolicy')
      .optional()
      .isIn(['FREE', 'PARTIAL', 'STRICT'])
      .withMessage('Invalid cancellation policy'),
    body('geoLat').optional().isFloat({ min: -90, max: 90 }),
    body('geoLng').optional().isFloat({ min: -180, max: 180 }),
  ],
};

const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  validate,
  authValidators,
  bookingValidators,
  reviewValidators,
  propertyValidators,
  paginationValidators,
};
