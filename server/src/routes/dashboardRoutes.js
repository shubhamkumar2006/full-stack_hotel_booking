const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/propertyController');
const adminCtrl = require('../controllers/adminController');
const adminService = require('../services/adminService');
const { authenticate, requireRole } = require('../middlewares/auth');

const hostAuth = [authenticate, requireRole('HOST', 'ADMIN')];
const adminAuth = [authenticate, requireRole('ADMIN')];

// ── Host Dashboard ────────────────────────────────────────
router.get('/host/properties', ...hostAuth, ctrl.getHostProperties);
router.get('/host/bookings',   ...hostAuth, async (req, res) => {
  const bookingService = require('../services/bookingService');
  const result = await bookingService.getHostBookings(req.user.id, req.query.page, req.query.limit, req.query.status);
  res.json({ success: true, data: result });
});
router.get('/host/earnings',   ...hostAuth, async (req, res) => {
  const data = await adminService.getHostEarnings(req.user.id, req.query.year, req.query.month);
  res.json({ success: true, data });
});

// ── Admin Dashboard ───────────────────────────────────────
router.get('/admin/users',                     ...adminAuth, adminCtrl.getUsers);
router.patch('/admin/users/:id/status',        ...adminAuth, adminCtrl.toggleUserStatus);
router.get('/admin/properties',                ...adminAuth, adminCtrl.getProperties);
router.patch('/admin/properties/:id/status',   ...adminAuth, adminCtrl.updatePropertyStatus);
router.get('/admin/bookings',                  ...adminAuth, adminCtrl.getBookings);
router.patch('/admin/bookings/:id/cancel',     ...adminAuth, adminCtrl.cancelBooking);
router.post('/admin/bookings/:id/refund',      ...adminAuth, adminCtrl.refundBooking);
router.get('/admin/analytics',                 ...adminAuth, adminCtrl.getAnalytics);
router.get('/admin/reviews',                   ...adminAuth, adminCtrl.getReviews);
router.delete('/admin/reviews/:id',            ...adminAuth, adminCtrl.removeReview);

module.exports = router;
