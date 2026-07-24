const prisma = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

// ── User Management ───────────────────────────────────────

const getUsers = async ({ page = 1, limit = 20, role, search, isVerified }) => {
  const where = {};
  if (role) where.role = role;
  if (isVerified !== undefined) where.isVerified = isVerified === 'true';
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, totalPages: Math.ceil(total / limit) };
};

const toggleUserStatus = async (userId, isActive) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.user.update({ where: { id: userId }, data: { isActive } });
};

// ── Property/Listing Management ───────────────────────────

const getAdminProperties = async ({ page = 1, limit = 20, status, city, search }) => {
  const where = {};
  if (status) where.status = status;
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [properties, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      include: {
        host: { select: { name: true, email: true } },
        _count: { select: { rooms: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.property.count({ where }),
  ]);
  return { properties, total, page, totalPages: Math.ceil(total / limit) };
};

const updatePropertyStatus = async (propertyId, status) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new AppError('Property not found', 404);
  return prisma.property.update({ where: { id: propertyId }, data: { status } });
};

// ── Booking Management ────────────────────────────────────

const getAdminBookings = async ({ page = 1, limit = 20, status, search }) => {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { id: { contains: search } },
      { guest: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: {
        guest: { select: { name: true, email: true } },
        room: { include: { property: { select: { name: true, city: true } } } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, totalPages: Math.ceil(total / limit) };
};

// ── Analytics ─────────────────────────────────────────────

const getAnalytics = async () => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [
    totalUsers,
    activeUsers,
    totalProperties,
    publishedProperties,
    totalBookings,
    confirmedBookings,
    revenueResult,
    monthlyRevenueResult,
    lastMonthRevenueResult,
    paymentSuccessCount,
    paymentTotalCount,
    topProperties,
    recentBookings,
    bookingsByStatus,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS', createdAt: { gte: firstOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESS', createdAt: { gte: lastMonth, lt: firstOfMonth } }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'SUCCESS' } }),
    prisma.payment.count(),
    prisma.property.findMany({
      where: { status: 'PUBLISHED' },
      include: { _count: { select: { rooms: { where: { bookings: { some: { status: 'CONFIRMED' } } } } } } },
      orderBy: { reviews: { _count: 'desc' } },
      take: 5,
      select: { id: true, name: true, city: true, thumbnailImage: true, _count: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        guest: { select: { name: true } },
        room: { include: { property: { select: { name: true } } } },
        payment: { select: { amount: true } },
      },
    }),
    prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  const totalRevenue = revenueResult._sum.amount || 0;
  const thisMonthRevenue = monthlyRevenueResult._sum.amount || 0;
  const lastMonthRevenue = lastMonthRevenueResult._sum.amount || 0;
  const paymentSuccessRate = paymentTotalCount > 0 ? (paymentSuccessCount / paymentTotalCount) * 100 : 0;

  return {
    overview: {
      totalUsers,
      activeUsers,
      totalProperties,
      publishedProperties,
      totalBookings,
      confirmedBookings,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth: lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
      paymentSuccessRate: parseFloat(paymentSuccessRate.toFixed(1)),
    },
    bookingsByStatus,
    topProperties,
    recentBookings,
  };
};

// ── Review Moderation ─────────────────────────────────────

const getAdminReviews = async ({ page = 1, limit = 20, isRemoved = false }) => {
  const where = { isRemoved: isRemoved === 'true' || isRemoved === true };
  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: {
        guest: { select: { name: true, email: true } },
        property: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.review.count({ where }),
  ]);
  return { reviews, total, page, totalPages: Math.ceil(total / limit) };
};

// ── Host Earnings ─────────────────────────────────────────

const getHostEarnings = async (hostId, year, month) => {
  const where = {
    room: { property: { hostId } },
    status: { in: ['CONFIRMED', 'COMPLETED'] },
  };

  if (year) {
    const start = new Date(year, month ? month - 1 : 0, 1);
    const end = month ? new Date(year, month, 0, 23, 59, 59) : new Date(year, 12, 0, 23, 59, 59);
    where.createdAt = { gte: start, lte: end };
  }

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { room: { include: { property: { select: { name: true } } } }, payment: { select: { amount: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.aggregate({ where, _sum: { totalAmount: true }, _count: { id: true } }),
  ]);

  // Group by property
  const byProperty = {};
  bookings.forEach((b) => {
    const propName = b.room.property.name;
    const propId = b.room.propertyId;
    if (!byProperty[propId]) byProperty[propId] = { name: propName, total: 0, bookings: 0 };
    byProperty[propId].total += b.totalAmount;
    byProperty[propId].bookings += 1;
  });

  return {
    totalEarnings: total._sum.totalAmount || 0,
    totalBookings: total._count.id,
    byProperty: Object.values(byProperty),
    bookings,
  };
};

module.exports = {
  getUsers,
  toggleUserStatus,
  getAdminProperties,
  updatePropertyStatus,
  getAdminBookings,
  getAnalytics,
  getAdminReviews,
  getHostEarnings,
};
