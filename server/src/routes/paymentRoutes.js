const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');

// Raw body capture needed for webhook signature verification
const rawBodyMiddleware = express.raw({ type: 'application/json' });

router.post('/order',   authenticate, ctrl.createOrder);
router.post('/verify',  authenticate, ctrl.verifyPayment);
router.post('/webhook', rawBodyMiddleware, ctrl.webhook);

module.exports = router;
