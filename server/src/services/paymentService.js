const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/db');
const bookingService = require('./bookingService');
const notificationService = require('./notificationService');
const logger = require('../config/logger');
const { AppError } = require('../middlewares/errorHandler');

// Demo mode: ONLY active when explicitly set in .env. Never auto-detect.
const isDemoMode = () => process.env.DEMO_MODE === 'true';
const isPlaceholderKey = () =>
  !process.env.RAZORPAY_KEY_ID ||
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_xxx');

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// ── Create Razorpay Order ─────────────────────────────────

const createOrder = async (bookingId, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, room: { include: { property: true } } },
  });

  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.guestId !== userId) throw new AppError('Not authorized', 403);
  if (booking.status !== 'PAYMENT_PENDING') throw new AppError('Booking is not awaiting payment', 400);

  // ── Demo mode (DEMO_MODE=true in .env) ──────────────────────────────────
  // Only active when the developer explicitly enables it. Never use in production.
  if (isDemoMode()) {
    const mockOrderId = `mock_order_${Math.random().toString(36).substring(2, 11)}`;
    await prisma.payment.update({
      where: { bookingId },
      data: { razorpayOrderId: mockOrderId },
    });
    logger.warn({ bookingId, orderId: mockOrderId }, '[DEMO MODE] Mock order created — no real payment will occur');
    return { orderId: mockOrderId, amount: Math.round(booking.totalAmount * 100), currency: 'INR', keyId: 'demo_key', isDemo: true };
  }

  // ── Real Razorpay keys required beyond this point ─────────────────────────
  if (isPlaceholderKey()) {
    throw new AppError(
      'Payment gateway is not configured. Please add your Razorpay API keys to the server .env file.',
      503
    );
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(booking.totalAmount * 100), // Razorpay uses paise
    currency: 'INR',
    receipt: `sn_${booking.id.split('-')[0]}`,
    notes: {
      bookingId: booking.id,
      propertyName: booking.room.property.name,
      roomName: booking.room.name,
    },
  });

  // Save order ID to payment record
  await prisma.payment.update({
    where: { bookingId },
    data: { razorpayOrderId: order.id },
  });

  logger.info({ bookingId, orderId: order.id, amount: booking.totalAmount }, 'Razorpay order created');
  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID };
};

const verifyPayment = async (payload) => {
  const razorpayOrderId = payload.razorpayOrderId || payload.razorpay_order_id;
  const razorpayPaymentId = payload.razorpayPaymentId || payload.razorpay_payment_id;
  const razorpaySignature = payload.razorpaySignature || payload.razorpay_signature;
  const bookingId = payload.bookingId;

  // ── Skip HMAC signature check for mock/demo orders or demo mode ───────────
  const isDemoOrder =
    razorpayOrderId?.startsWith('mock_order_') ||
    razorpayPaymentId?.startsWith('pay_demo_') ||
    razorpaySignature?.startsWith('sig_demo_') ||
    isDemoMode();

  if (!isDemoOrder) {
    // ── Real signature verification (HMAC-SHA256) ─────────────────────────
    if (!process.env.RAZORPAY_KEY_SECRET || isPlaceholderKey()) {
      throw new AppError(
        'Payment gateway is not configured. Cannot verify payment.',
        503
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logger.warn({ bookingId, razorpayOrderId }, 'Payment signature verification FAILED — possible fraud attempt');
      throw new AppError('Payment verification failed — signature mismatch. Payment not confirmed.', 400);
    }
  } else {
    logger.warn({ bookingId, razorpayOrderId }, '[DEMO MODE] Skipping signature check for demo order');
  }

  // Find payment record by razorpayOrderId or bookingId
  const existingPayment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(razorpayOrderId ? [{ razorpayOrderId }] : []),
        ...(bookingId ? [{ bookingId }] : []),
      ],
    },
  });

  if (!existingPayment) {
    throw new AppError('Payment record not found for this reservation', 404);
  }

  const payment = await prisma.payment.update({
    where: { id: existingPayment.id },
    data: {
      razorpayOrderId: razorpayOrderId || existingPayment.razorpayOrderId || `mock_order_${bookingId}`,
      razorpayPaymentId: razorpayPaymentId || `pay_demo_${Date.now()}`,
      razorpaySignature: razorpaySignature || `sig_demo_${Date.now()}`,
      status: 'SUCCESS',
    },
    include: { booking: { include: { guest: { select: { name: true, email: true } } } } },
  });

  // Confirm the booking
  await bookingService.confirmBooking(payment.bookingId);

  // Send receipt email
  await notificationService.sendPaymentReceiptEmail(
    payment.booking.guest.email,
    payment.booking.guest.name,
    {
      id: payment.id,
      amount: payment.amount,
      razorpayPaymentId: payment.razorpayPaymentId,
    }
  );

  logger.info({ bookingId: payment.bookingId, razorpayPaymentId }, 'Payment verified and booking confirmed');
  return payment;
};

// ── Webhook Handler (idempotent) ──────────────────────────

const handleWebhook = async (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new AppError('Webhook signature invalid', 400);
  }

  const event = JSON.parse(rawBody);
  const { event: eventType, payload } = event;

  logger.info({ eventType }, 'Razorpay webhook received');

  if (eventType === 'payment.captured') {
    const { order_id, id: paymentId } = payload.payment.entity;

    // Idempotency: check if already processed
    const existing = await prisma.payment.findFirst({ where: { razorpayOrderId: order_id } });
    if (!existing || existing.status === 'SUCCESS') return { processed: false };

    await prisma.payment.update({
      where: { razorpayOrderId: order_id },
      data: { razorpayPaymentId: paymentId, status: 'SUCCESS' },
    });

    await bookingService.confirmBooking(existing.bookingId);
    return { processed: true };
  }

  if (eventType === 'payment.failed') {
    const { order_id } = payload.payment.entity;
    await prisma.payment.updateMany({
      where: { razorpayOrderId: order_id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    // Revert booking status to PENDING
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: order_id } });
    if (payment) {
      await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'PENDING' } });
    }
    return { processed: true };
  }

  return { processed: false };
};

// ── Process Refund ────────────────────────────────────────

const processRefund = async (bookingId, amount) => {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== 'SUCCESS') {
    throw new AppError('No successful payment found for this booking', 400);
  }

  const razorpay = getRazorpay();
  const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: Math.round(amount * 100),
    notes: { reason: 'Booking cancellation refund' },
  });

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { refundId: refund.id, refundAmount: amount, status: 'REFUNDED' },
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'REFUNDED' } }),
  ]);

  logger.info({ bookingId, refundId: refund.id, amount }, 'Refund processed');
  return refund;
};

module.exports = { createOrder, verifyPayment, handleWebhook, processRefund };
