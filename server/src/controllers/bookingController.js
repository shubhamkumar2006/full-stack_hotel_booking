const bookingService = require('../services/bookingService');
const prisma = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const createBooking = async (req, res) => {
  const {
    roomId,
    checkIn,
    checkOut,
    guestsCount,
    notes,
    includePickup,
    pickupVehicleCategory,
    pickupDistanceKm,
    pickupLocation,
    includeDining,
    diningPlan,
    couponCode,
  } = req.body;

  const result = await bookingService.createBooking({
    guestId: req.user.id,
    roomId,
    checkIn,
    checkOut,
    guestsCount: parseInt(guestsCount) || 1,
    notes,
    includePickup,
    pickupVehicleCategory,
    pickupDistanceKm,
    pickupLocation,
    includeDining,
    diningPlan,
    couponCode,
  });
  res.status(201).json({ success: true, data: result });
};

const getBooking = async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      room: { include: { property: { include: { host: { select: { name: true, avatar: true } } } } } },
      guest: { select: { name: true, email: true, avatar: true } },
      payment: true,
      review: true,
    },
  });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.guestId !== req.user.id && req.user.role !== 'ADMIN') {
    const isHost = booking.room?.property?.hostId === req.user.id;
    if (!isHost) throw new AppError('Not authorized', 403);
  }
  res.json({ success: true, data: booking });
};

const getMyBookings = async (req, res) => {
  const result = await bookingService.getGuestBookings(req.user.id, req.query.page, req.query.limit);
  res.json({ success: true, data: result });
};

const cancelBooking = async (req, res) => {
  const result = await bookingService.cancelBooking(req.params.id, req.user.id);
  res.json({ success: true, data: result });
};

const checkAvailability = async (req, res) => {
  const { roomId, checkIn, checkOut, guestsCount } = req.query;
  const room = await bookingService.checkRoomAvailability(roomId, checkIn, checkOut, parseInt(guestsCount) || 1);
  const { total, nights } = await bookingService.calculateTotal(room, checkIn, checkOut);
  res.json({ success: true, data: { available: true, total, nights, pricePerNight: room.pricePerNight } });
};

module.exports = { createBooking, getBooking, getMyBookings, cancelBooking, checkAvailability };
