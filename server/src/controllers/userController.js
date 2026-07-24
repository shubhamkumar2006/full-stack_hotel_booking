const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isVerified: true, avatar: true, hostBio: true, createdAt: true,
      _count: { select: { properties: true, bookings: true, wishlists: true } },
    },
  });
  res.json({ success: true, data: user });
};

const updateMe = async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'hostBio'];
  const updateData = {};
  allowed.forEach((key) => { if (req.body[key] !== undefined) updateData[key] = req.body[key]; });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, hostBio: true },
  });
  res.json({ success: true, data: user });
};

const deactivateAccount = async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { isActive: false } });
  res.json({ success: true, message: 'Account deactivated' });
};

const uploadAvatar = async (req, res) => {
  if (!req.file) throw new AppError('No image uploaded', 400);
  const avatar = req.file.path;
  await prisma.user.update({ where: { id: req.user.id }, data: { avatar } });
  res.json({ success: true, data: { avatar } });
};

const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.notification.count({ where: { userId: req.user.id } }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);
  res.json({ success: true, data: { notifications, total, unreadCount, page: parseInt(page) } });
};

const markNotificationsRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true, message: 'All notifications marked as read' });
};

module.exports = { getMe, updateMe, deactivateAccount, uploadAvatar, getNotifications, markNotificationsRead };
