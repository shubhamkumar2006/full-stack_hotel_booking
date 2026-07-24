const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { createUploader } = require('../config/cloudinary');

const avatarUploader = createUploader('avatars', 'avatar', 1);

router.get('/me',                  authenticate, ctrl.getMe);
router.patch('/me',                authenticate, ctrl.updateMe);
router.delete('/me',               authenticate, ctrl.deactivateAccount);
router.post('/me/avatar',          authenticate, avatarUploader, ctrl.uploadAvatar);
router.get('/notifications',       authenticate, ctrl.getNotifications);
router.patch('/notifications/read',authenticate, ctrl.markNotificationsRead);

module.exports = router;
