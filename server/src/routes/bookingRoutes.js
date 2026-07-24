const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingController');
const { authenticate, requireRole, requireVerified } = require('../middlewares/auth');
const { bookingValidators, validate } = require('../middlewares/validate');

router.get('/check-availability', ctrl.checkAvailability);
router.get('/me',       authenticate, ctrl.getMyBookings);
router.get('/:id',      authenticate, ctrl.getBooking);
router.post('/',        authenticate, requireVerified, bookingValidators.create, validate, ctrl.createBooking);
router.patch('/:id/cancel', authenticate, ctrl.cancelBooking);

module.exports = router;
