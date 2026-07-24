const adminService = require('../services/adminService');
const bookingService = require('../services/bookingService');
const paymentService = require('../services/paymentService');
const reviewService = require('../services/reviewService');

// ── Users ─────────────────────────────────────────────────
const getUsers = async (req, res) => {
  const result = await adminService.getUsers(req.query);
  res.json({ success: true, data: result });
};

const toggleUserStatus = async (req, res) => {
  const user = await adminService.toggleUserStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: user });
};

// ── Properties ────────────────────────────────────────────
const getProperties = async (req, res) => {
  const result = await adminService.getAdminProperties(req.query);
  res.json({ success: true, data: result });
};

const updatePropertyStatus = async (req, res) => {
  const property = await adminService.updatePropertyStatus(req.params.id, req.body.status);
  res.json({ success: true, data: property });
};

// ── Bookings ──────────────────────────────────────────────
const getBookings = async (req, res) => {
  const result = await adminService.getAdminBookings(req.query);
  res.json({ success: true, data: result });
};

const cancelBooking = async (req, res) => {
  const result = await bookingService.cancelBooking(req.params.id, req.user.id, true);
  res.json({ success: true, data: result });
};

const refundBooking = async (req, res) => {
  const refund = await paymentService.processRefund(req.params.id, req.body.amount);
  res.json({ success: true, data: refund });
};

// ── Analytics ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  const data = await adminService.getAnalytics();
  res.json({ success: true, data });
};

// ── Reviews ───────────────────────────────────────────────
const getReviews = async (req, res) => {
  const result = await adminService.getAdminReviews(req.query);
  res.json({ success: true, data: result });
};

const removeReview = async (req, res) => {
  await reviewService.removeReview(req.params.id);
  res.json({ success: true, message: 'Review removed' });
};

module.exports = {
  getUsers, toggleUserStatus, getProperties, updatePropertyStatus,
  getBookings, cancelBooking, refundBooking, getAnalytics, getReviews, removeReview,
};
