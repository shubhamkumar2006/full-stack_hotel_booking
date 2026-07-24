const prisma = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

// ── Helpers ───────────────────────────────────────────────

const buildPropertyWhere = ({ city, status, hostId, propertyType, minRating }) => {
  const where = {};
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (status) where.status = status;
  else where.status = 'PUBLISHED';
  if (hostId) where.hostId = hostId;
  if (propertyType) where.propertyType = propertyType;
  return where;
};

const getPagination = (page = 1, limit = 12) => {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 12;
  return {
    skip: (p - 1) * l,
    take: l,
  };
};

// ── Search Properties ─────────────────────────────────────

const searchProperties = async ({
  city,
  checkIn,
  checkOut,
  guests,
  minPrice,
  maxPrice,
  amenities,
  propertyType,
  instantBook,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  limit = 12,
}) => {
  const where = { status: 'PUBLISHED' };
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (propertyType) where.propertyType = propertyType;
  if (amenities && amenities.length > 0) {
    where.amenities = { array_contains: amenities };
  }

  // Filter rooms by availability + price + occupancy
  const roomWhere = {};
  if (guests) roomWhere.maxOccupancy = { gte: parseInt(guests) };
  if (minPrice || maxPrice) {
    roomWhere.pricePerNight = {};
    if (minPrice) roomWhere.pricePerNight.gte = parseFloat(minPrice);
    if (maxPrice) roomWhere.pricePerNight.lte = parseFloat(maxPrice);
  }
  if (instantBook) roomWhere.isInstantBook = true;

  // Exclude rooms with confirmed bookings overlapping the date range
  if (checkIn && checkOut) {
    roomWhere.bookings = {
      none: {
        status: { in: ['CONFIRMED', 'PAYMENT_PENDING'] },
        checkIn: { lt: new Date(checkOut) },
        checkOut: { gt: new Date(checkIn) },
      },
    };
    // Exclude blocked availability dates
    roomWhere.availability = {
      none: {
        isBlocked: true,
        date: { gte: new Date(checkIn), lt: new Date(checkOut) },
      },
    };
  }

  const orderByMap = {
    price: { rooms: { _min: { pricePerNight: sortOrder } } },
    rating: { reviews: { _avg: { rating: sortOrder } } },
    createdAt: { createdAt: sortOrder },
  };

  const [properties, total] = await prisma.$transaction([
    prisma.property.findMany({
      where: { ...where, rooms: { some: roomWhere } },
      include: {
        rooms: { where: roomWhere, select: { id: true, pricePerNight: true, maxOccupancy: true, name: true, images: true } },
        reviews: { select: { rating: true }, where: { isRemoved: false } },
        host: { select: { name: true, avatar: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: sortOrder },
      ...getPagination(page, limit),
    }),
    prisma.property.count({ where: { ...where, rooms: { some: roomWhere } } }),
  ]);

  // Compute average rating
  const results = properties.map((p) => ({
    ...p,
    avgRating: p.reviews.length > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null,
    reviewCount: p._count.reviews,
    lowestPrice: p.rooms.length > 0 ? Math.min(...p.rooms.map((r) => r.pricePerNight)) : null,
  }));

  return { properties: results, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ── Get All Properties (Host-scoped) ──────────────────────

const getHostProperties = async (hostId, page = 1, limit = 20) => {
  const [properties, total] = await prisma.$transaction([
    prisma.property.findMany({
      where: { hostId },
      include: {
        rooms: { select: { id: true, name: true, pricePerNight: true } },
        _count: { select: { bookings: { where: { room: { propertyId: undefined } } }, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...getPagination(page, limit),
    }),
    prisma.property.count({ where: { hostId } }),
  ]);
  return { properties, total, page, totalPages: Math.ceil(total / limit) };
};

// ── Get Single Property ───────────────────────────────────

const getProperty = async (id, userId = null) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, avatar: true, hostBio: true, createdAt: true } },
      rooms: {
        include: {
          availability: {
            where: { date: { gte: new Date() } },
            select: { date: true, isBlocked: true, customPrice: true },
          },
        },
      },
      reviews: {
        where: { isRemoved: false },
        include: { guest: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { reviews: { where: { isRemoved: false } } } },
    },
  });

  if (!property) throw new AppError('Property not found', 404);

  const avgRating =
    property.reviews.length > 0
      ? property.reviews.reduce((s, r) => s + r.rating, 0) / property.reviews.length
      : null;

  // Check if in user wishlist
  let isWishlisted = false;
  if (userId) {
    const wish = await prisma.wishlist.findUnique({ where: { userId_propertyId: { userId, propertyId: id } } });
    isWishlisted = !!wish;
  }

  return { ...property, avgRating, isWishlisted };
};

// ── Create Property ───────────────────────────────────────

const createProperty = async (hostId, data) => {
  const property = await prisma.property.create({
    data: {
      hostId,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country || 'India',
      geoLat: data.geoLat ? parseFloat(data.geoLat) : null,
      geoLng: data.geoLng ? parseFloat(data.geoLng) : null,
      amenities: data.amenities || [],
      propertyType: data.propertyType || 'hotel',
      houseRules: data.houseRules,
      cancellationPolicy: data.cancellationPolicy || 'FREE',
      thumbnailImage: data.thumbnailImage,
      status: 'DRAFT',
    },
  });

  logger.info({ propertyId: property.id, hostId }, 'Property created');
  return property;
};

// ── Update Property ───────────────────────────────────────

const updateProperty = async (id, hostId, data) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new AppError('Property not found', 404);
  if (property.hostId !== hostId) throw new AppError('Not authorized', 403);

  const allowed = ['name', 'description', 'address', 'city', 'state', 'country', 'geoLat', 'geoLng',
    'amenities', 'propertyType', 'houseRules', 'cancellationPolicy', 'thumbnailImage', 'status'];

  const updateData = {};
  allowed.forEach((key) => { if (data[key] !== undefined) updateData[key] = data[key]; });

  return prisma.property.update({ where: { id }, data: updateData });
};

// ── Delete Property ───────────────────────────────────────

const deleteProperty = async (id, hostId) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new AppError('Property not found', 404);
  if (property.hostId !== hostId) throw new AppError('Not authorized', 403);

  await prisma.property.delete({ where: { id } });
  logger.info({ propertyId: id, hostId }, 'Property deleted');
};

// ── Room CRUD ─────────────────────────────────────────────

const createRoom = async (propertyId, hostId, data) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new AppError('Property not found', 404);
  if (property.hostId !== hostId) throw new AppError('Not authorized', 403);

  return prisma.room.create({
    data: {
      propertyId,
      name: data.name,
      description: data.description,
      pricePerNight: parseFloat(data.pricePerNight),
      maxOccupancy: parseInt(data.maxOccupancy),
      bedConfig: data.bedConfig,
      images: data.images || [],
      isInstantBook: data.isInstantBook || false,
    },
  });
};

const updateRoom = async (roomId, hostId, data) => {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { property: true } });
  if (!room) throw new AppError('Room not found', 404);
  if (room.property.hostId !== hostId) throw new AppError('Not authorized', 403);

  return prisma.room.update({
    where: { id: roomId },
    data: {
      name: data.name,
      description: data.description,
      pricePerNight: data.pricePerNight ? parseFloat(data.pricePerNight) : undefined,
      maxOccupancy: data.maxOccupancy ? parseInt(data.maxOccupancy) : undefined,
      bedConfig: data.bedConfig,
      images: data.images,
      isInstantBook: data.isInstantBook,
    },
  });
};

const deleteRoom = async (roomId, hostId) => {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { property: true } });
  if (!room) throw new AppError('Room not found', 404);
  if (room.property.hostId !== hostId) throw new AppError('Not authorized', 403);
  await prisma.room.delete({ where: { id: roomId } });
};

// ── Availability Management ───────────────────────────────

const setRoomAvailability = async (roomId, hostId, dates) => {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { property: true } });
  if (!room) throw new AppError('Room not found', 404);
  if (room.property.hostId !== hostId) throw new AppError('Not authorized', 403);

  // Upsert each date
  await prisma.$transaction(
    dates.map((d) =>
      prisma.roomAvailability.upsert({
        where: { roomId_date: { roomId, date: new Date(d.date) } },
        create: { roomId, date: new Date(d.date), isBlocked: d.isBlocked, customPrice: d.customPrice },
        update: { isBlocked: d.isBlocked, customPrice: d.customPrice },
      })
    )
  );
};

module.exports = {
  searchProperties,
  getHostProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  createRoom,
  updateRoom,
  deleteRoom,
  setRoomAvailability,
};
