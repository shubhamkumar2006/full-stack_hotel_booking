const prisma = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

// ── Get Wishlist ──────────────────────────────────────────

const getWishlist = async (userId) => {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      property: {
        include: {
          rooms: { select: { pricePerNight: true }, orderBy: { pricePerNight: 'asc' }, take: 1 },
          reviews: { select: { rating: true }, where: { isRemoved: false } },
          _count: { select: { reviews: { where: { isRemoved: false } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    ...item,
    property: {
      ...item.property,
      avgRating:
        item.property.reviews.length > 0
          ? item.property.reviews.reduce((s, r) => s + r.rating, 0) / item.property.reviews.length
          : null,
      lowestPrice: item.property.rooms[0]?.pricePerNight ?? null,
    },
  }));
};

// ── Add to Wishlist ───────────────────────────────────────

const addToWishlist = async (userId, propertyId) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new AppError('Property not found', 404);

  return prisma.wishlist.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    create: { userId, propertyId },
    update: {},
  });
};

// ── Remove from Wishlist ──────────────────────────────────

const removeFromWishlist = async (userId, propertyId) => {
  const item = await prisma.wishlist.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  });
  if (!item) throw new AppError('Not in wishlist', 404);
  await prisma.wishlist.delete({ where: { userId_propertyId: { userId, propertyId } } });
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
