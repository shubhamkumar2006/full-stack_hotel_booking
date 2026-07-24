const prisma = require('../config/db');
const { acquireBookingLock, releaseBookingLock } = require('../config/redis');
const notificationService = require('./notificationService');
const logger = require('../config/logger');
const { AppError } = require('../middlewares/errorHandler');

// ── Availability Check ────────────────────────────────────

const checkRoomAvailability = async (roomId, checkIn, checkOut, guestsCount) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError('Room not found', 404);

  if (room.maxOccupancy < guestsCount) {
    throw new AppError(`This room supports max ${room.maxOccupancy} guests`, 400);
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate >= checkOutDate) throw new AppError('Check-out must be after check-in', 400);
  if (checkInDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    throw new AppError('Check-in date must be today or later', 400);
  }

  // Check for confirmed/payment_pending bookings in overlap
  const overlapping = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: ['CONFIRMED', 'PAYMENT_PENDING'] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
  });

  if (overlapping) throw new AppError('Room is not available for selected dates', 409);

  // Check for host-blocked dates
  const blocked = await prisma.roomAvailability.findFirst({
    where: {
      roomId,
      isBlocked: true,
      date: { gte: checkInDate, lt: checkOutDate },
    },
  });

  if (blocked) throw new AppError('Room has blocked dates in your selected range', 409);

  return room;
};

// ── Calculate Total Amount ────────────────────────────────

const calculateTotal = async (room, checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  let total = 0;
  const current = new Date(checkInDate);

  while (current < checkOutDate) {
    const customAvail = await prisma.roomAvailability.findUnique({
      where: { roomId_date: { roomId: room.id, date: new Date(current) } },
    });
    const priceForNight = customAvail?.customPrice ?? room.pricePerNight;
    total += priceForNight;
    current.setDate(current.getDate() + 1);
  }

  return { total, nights };
};

// ── Create Booking ────────────────────────────────────────

const VEHICLE_RATES = {
  moto: 8,
  auto: 12,
  go: 14,
  sedan: 16,
  premier: 22,
  xl: 28,
  rentals: 20,
  intercity: 18,
};

const DINING_PLANS = {
  breakfast: { name: 'Buffet Breakfast', pricePerGuestPerDay: 250 },
  half_board: { name: 'Half-Board (Breakfast + Dinner)', pricePerGuestPerDay: 650 },
  full_board: { name: 'Full-Board (All 3 Meals)', pricePerGuestPerDay: 1100 },
  all_inclusive: { name: 'All-Inclusive Gourmet & Beverages', pricePerGuestPerDay: 1800 },
};

const VALID_COUPONS = {
  welcome10: { code: 'WELCOME10', type: 'PERCENT', value: 10, maxDiscount: 1000, desc: '10% OFF on your booking' },
  stayfest15: { code: 'STAYFEST15', type: 'PERCENT', value: 15, maxDiscount: 2500, desc: '15% OFF up to ₹2,500' },
  luxury500: { code: 'LUXURY500', type: 'FLAT', value: 500, maxDiscount: 500, desc: 'Flat ₹500 OFF instant discount' },
  monsoon20: { code: 'MONSOON20', type: 'PERCENT', value: 20, maxDiscount: 3000, desc: '20% OFF on resort stays' },
  '10': { code: '10', type: 'PERCENT', value: 10, maxDiscount: 99999, desc: '10% OFF on your booking' },
  'coupon10': { code: 'COUPON10', type: 'PERCENT', value: 10, maxDiscount: 99999, desc: '10% OFF coupon code' },
};

const createBooking = async ({
  guestId, roomId, checkIn, checkOut, guestsCount, notes,
  includePickup, pickupVehicleCategory, pickupDistanceKm, pickupLocation,
  includeDining, diningPlan, couponCode,
}) => {
  const room = await checkRoomAvailability(roomId, checkIn, checkOut, guestsCount);

  // Acquire Redis lock to prevent double-booking during checkout
  const lockAcquired = await acquireBookingLock(roomId, checkIn, checkOut);
  if (!lockAcquired) {
    throw new AppError('This room is currently being booked by another user. Please try again shortly.', 409);
  }

  try {
    const { total: roomTotal, nights } = await calculateTotal(room, checkIn, checkOut);

    // Calculate Pickup Fee
    const categoryKey = pickupVehicleCategory?.toLowerCase() || 'sedan';
    const ratePerKm = VEHICLE_RATES[categoryKey] || 16;
    const distance = includePickup ? Math.max(0, parseFloat(pickupDistanceKm || 0)) : 0;
    const pickupFee = Math.round(distance * ratePerKm);

    // Calculate Dining Fee
    let diningFee = 0;
    const planKey = diningPlan?.toLowerCase();
    if (includeDining && planKey && DINING_PLANS[planKey]) {
      const plan = DINING_PLANS[planKey];
      diningFee = Math.round(plan.pricePerGuestPerDay * guestsCount * nights);
    }

    // Calculate GST (10% on the original price of hotel)
    const gstRate = 10;
    const gstFee = Math.round(roomTotal * 0.10);

    // Calculate Offer / Coupon Discount
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const normCode = couponCode.trim().toLowerCase();
      if (VALID_COUPONS[normCode]) {
        const c = VALID_COUPONS[normCode];
        appliedCoupon = c.code;
        if (c.type === 'PERCENT') {
          discountAmount = Math.min(c.maxDiscount || 99999, Math.round(roomTotal * (c.value / 100)));
        } else {
          discountAmount = Math.min(roomTotal, c.value);
        }
      }
    }

    const grandTotal = Math.max(0, roomTotal - discountAmount + gstFee + pickupFee + diningFee);

    const booking = await prisma.booking.create({
      data: {
        guestId,
        roomId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guestsCount,
        notes,
        gstFee,
        gstRate,
        includePickup: Boolean(includePickup),
        pickupVehicleCategory: categoryKey,
        pickupDistanceKm: distance,
        pickupFee,
        pickupLocation: pickupLocation || null,
        includeDining: Boolean(includeDining),
        diningPlan: includeDining ? planKey : null,
        diningFee,
        couponCode: appliedCoupon,
        discountAmount,
        totalAmount: grandTotal,
        status: 'PAYMENT_PENDING',
      },
      include: {
        room: { include: { property: true } },
        guest: { select: { name: true, email: true } },
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: { bookingId: booking.id, amount: grandTotal, status: 'PENDING' },
    });

    logger.info({ bookingId: booking.id, guestId, roomId, nights, roomTotal, pickupFee, diningFee, grandTotal }, 'Booking created');
    return { booking, nights, total: grandTotal };
  } catch (err) {
    // Release lock on error
    await releaseBookingLock(roomId, checkIn, checkOut);
    throw err;
  }
};

// ── Confirm Booking (post-payment) ────────────────────────

const confirmBooking = async (bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: { include: { property: { include: { host: { select: { name: true, email: true } } } } } },
      guest: { select: { name: true, email: true } },
    },
  });

  if (!booking) throw new AppError('Booking not found', 404);

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } });

  // Release Redis lock now that booking is confirmed
  await releaseBookingLock(
    booking.roomId,
    booking.checkIn.toISOString().split('T')[0],
    booking.checkOut.toISOString().split('T')[0]
  );

  // Send confirmation emails
  await notificationService.sendBookingConfirmationEmail(booking.guest.email, booking.guest.name, {
    id: booking.id,
    propertyName: booking.room.property.name,
    roomName: booking.room.name,
    checkIn: booking.checkIn.toLocaleDateString('en-IN'),
    checkOut: booking.checkOut.toLocaleDateString('en-IN'),
    guestsCount: booking.guestsCount,
    totalAmount: booking.totalAmount,
  });

  // In-app notification
  await notificationService.createInAppNotification(prisma, {
    userId: booking.guestId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed!',
    message: `Your booking at ${booking.room.property.name} is confirmed.`,
    metadata: { bookingId },
  });

  // Notify host
  await notificationService.createInAppNotification(prisma, {
    userId: booking.room.property.hostId,
    type: 'BOOKING_CONFIRMED',
    title: 'New Booking!',
    message: `${booking.guest.name} booked ${booking.room.name} from ${booking.checkIn.toLocaleDateString('en-IN')}`,
    metadata: { bookingId },
  });

  logger.info({ bookingId }, 'Booking confirmed');
  return booking;
};

// ── Cancel Booking ────────────────────────────────────────

const calculateRefund = (booking) => {
  const checkIn = new Date(booking.checkIn);
  const now = new Date();
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);
  const policy = booking.room.property.cancellationPolicy;

  if (policy === 'FREE' && hoursUntilCheckIn >= 48) return booking.totalAmount;
  if (policy === 'PARTIAL' && hoursUntilCheckIn >= 24) return booking.totalAmount * 0.5;
  return 0;
};

const cancelBooking = async (bookingId, userId, isAdmin = false) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: { include: { property: true } },
      guest: { select: { name: true, email: true } },
      payment: true,
    },
  });

  if (!booking) throw new AppError('Booking not found', 404);
  if (!isAdmin && booking.guestId !== userId) throw new AppError('Not authorized', 403);
  if (['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(booking.status)) {
    throw new AppError('Booking cannot be cancelled in its current state', 400);
  }

  const refundAmount = calculateRefund(booking);

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });

  // Release lock in case payment was pending
  await releaseBookingLock(
    booking.roomId,
    booking.checkIn.toISOString().split('T')[0],
    booking.checkOut.toISOString().split('T')[0]
  );

  // Send cancellation email
  await notificationService.sendCancellationEmail(
    booking.guest.email,
    booking.guest.name,
    { id: booking.id, propertyName: booking.room.property.name },
    refundAmount
  );

  await notificationService.createInAppNotification(prisma, {
    userId: booking.guestId,
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    message: `Your booking at ${booking.room.property.name} has been cancelled.`,
    metadata: { bookingId, refundAmount },
  });

  logger.info({ bookingId, refundAmount }, 'Booking cancelled');
  return { bookingId, refundAmount };
};

// ── Get Guest Bookings ────────────────────────────────────

const getGuestBookings = async (guestId, page = 1, limit = 10) => {
  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where: { guestId },
      include: {
        room: { include: { property: { select: { name: true, city: true, thumbnailImage: true } } } },
        payment: { select: { status: true, razorpayPaymentId: true } },
        review: { select: { id: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where: { guestId } }),
  ]);
  return { bookings, total, page, totalPages: Math.ceil(total / limit) };
};

// ── Get Host Bookings ─────────────────────────────────────

const getHostBookings = async (hostId, page = 1, limit = 10, status) => {
  const where = { room: { property: { hostId } } };
  if (status) where.status = status;

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: {
        room: { include: { property: { select: { name: true, id: true } } } },
        guest: { select: { name: true, email: true, avatar: true } },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, totalPages: Math.ceil(total / limit) };
};

// ── Mark Completed ────────────────────────────────────────

const markBookingsCompleted = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const result = await prisma.booking.updateMany({
    where: { status: 'CONFIRMED', checkOut: { lte: yesterday } },
    data: { status: 'COMPLETED' },
  });

  logger.info({ count: result.count }, 'Bookings marked as completed');
  return result.count;
};

module.exports = {
  checkRoomAvailability,
  calculateTotal,
  createBooking,
  confirmBooking,
  cancelBooking,
  calculateRefund,
  getGuestBookings,
  getHostBookings,
  markBookingsCompleted,
};
