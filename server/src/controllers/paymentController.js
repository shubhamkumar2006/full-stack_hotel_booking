const paymentService = require('../services/paymentService');

const createOrder = async (req, res) => {
  const order = await paymentService.createOrder(req.body.bookingId, req.user.id);
  res.json({ success: true, data: order });
};

const verifyPayment = async (req, res) => {
  const payment = await paymentService.verifyPayment(req.body);
  res.json({ success: true, data: payment, message: 'Payment verified and booking confirmed' });
};

// Raw body is needed for Razorpay webhook signature verification
const webhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentService.handleWebhook(req.rawBody, signature);
  res.json({ success: true, ...result });
};

module.exports = { createOrder, verifyPayment, webhook };
