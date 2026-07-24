const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { authValidators, validate } = require('../middlewares/validate');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter');

router.post('/signup',   authLimiter, authValidators.signup,          validate, ctrl.signup);
router.post('/login',    authLimiter, authValidators.login,           validate, ctrl.login);
router.post('/login-phone-request', authLimiter, authValidators.loginPhoneRequest, validate, ctrl.loginPhoneRequest);
router.post('/login-phone-verify',  authLimiter, authValidators.loginPhoneVerify,  validate, ctrl.loginPhoneVerify);
router.post('/verify-otp', otpLimiter, authValidators.verifyOtp,     validate, ctrl.verifyOtp);
router.post('/refresh',                                                          ctrl.refreshToken);
router.post('/logout',                                                           ctrl.logout);
router.post('/forgot-password', authLimiter, authValidators.forgotPassword, validate, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, authValidators.resetPassword,  validate, ctrl.resetPassword);

module.exports = router;
