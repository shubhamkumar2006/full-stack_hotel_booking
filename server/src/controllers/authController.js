const authService = require('../services/authService');

const signup = async (req, res) => {
  const result = await authService.signup(req.body, res);
  res.status(201).json({ success: true, message: 'Account created successfully', data: result });
};

const verifyOtp = async (req, res) => {
  const result = await authService.verifyOtp(req.body, res);
  res.json({ success: true, message: 'Account verified successfully', data: result });
};

const login = async (req, res) => {
  const result = await authService.login(req.body, res);
  res.json({ success: true, data: result });
};

const refreshToken = async (req, res) => {
  const result = await authService.refreshAccessToken(req, res);
  res.json({ success: true, data: result });
};

const logout = async (req, res) => {
  await authService.logout(req, res);
  res.json({ success: true, message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body);
  res.json({ success: true, message: 'If your email is registered, you will receive a reset OTP.' });
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ success: true, message: 'Password reset successfully' });
};

const loginPhoneRequest = async (req, res) => {
  const result = await authService.loginPhoneRequest(req.body);
  res.json({ success: true, message: result.message, otp: result.otp });
};

const loginPhoneVerify = async (req, res) => {
  const result = await authService.loginPhoneVerify(req.body, res);
  res.json({ success: true, data: result });
};

module.exports = {
  signup,
  verifyOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  loginPhoneRequest,
  loginPhoneVerify,
};
