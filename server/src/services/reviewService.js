const prisma = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

// ── Create Review ─────────────────────────────────────────

const createReview = async ({ guestId, bookingId, rating, comment, photos = [] }) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: { include: { property: true } } },
  });

  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.guestId !== guestId) throw new AppError('Not authorized', 403);
  if (booking.status !== 'COMPLETED') throw new AppError('You can only review completed stays', 400);

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw new AppError('You have already reviewed this stay', 409);

  const review = await prisma.review.create({
    data: {
      bookingId,
      guestId,
      propertyId: booking.room.propertyId,
      rating,
      comment,
      photos,
    },
    include: { guest: { select: { name: true, avatar: true } } },
  });

  // Notify host
  await notificationService.createInAppNotification(prisma, {
    userId: booking.room.property.hostId,
    type: 'REVIEW_RECEIVED',
    title: 'New Review',
    message: `${review.guest.name} left a ${rating}-star review for ${booking.room.property.name}`,
    metadata: { reviewId: review.id, propertyId: booking.room.propertyId },
  });

  logger.info({ reviewId: review.id, bookingId, guestId, rating }, 'Review created');
  return review;
};

// ── Get Property Reviews ──────────────────────────────────

const getPropertyReviews = async (propertyId, page = 1, limit = 10) => {
  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { propertyId, isRemoved: false },
      include: { guest: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { propertyId, isRemoved: false } }),
  ]);

  const avgRating =
    total > 0
      ? (await prisma.review.aggregate({ where: { propertyId, isRemoved: false }, _avg: { rating: true } }))._avg.rating
      : null;

  return { reviews, total, avgRating, page, totalPages: Math.ceil(total / limit) };
};

// ── Host Reply ────────────────────────────────────────────

const addHostReply = async (reviewId, hostId, reply) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { property: true, guest: { select: { id: true } } },
  });

  if (!review) throw new AppError('Review not found', 404);
  if (review.property.hostId !== hostId) throw new AppError('Not authorized', 403);
  if (review.hostReply) throw new AppError('You have already replied to this review', 400);

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { hostReply: reply },
  });

  // Notify guest
  await notificationService.createInAppNotification(prisma, {
    userId: review.guest.id,
    type: 'HOST_REPLY',
    title: 'Host replied to your review',
    message: `The host responded to your review of ${review.property.name}`,
    metadata: { reviewId, propertyId: review.propertyId },
  });

  return updated;
};

// ── Remove Review (admin) ─────────────────────────────────

const removeReview = async (reviewId) => {
  return prisma.review.update({ where: { id: reviewId }, data: { isRemoved: true } });
};

module.exports = { createReview, getPropertyReviews, addHostReply, removeReview };
