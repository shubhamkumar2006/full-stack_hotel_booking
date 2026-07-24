const express = require('express');
const router = express.Router();
const reviewCtrl = require('../controllers/reviewController');
const wishlistCtrl = require('../controllers/wishlistController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { reviewValidators, validate } = require('../middlewares/validate');
const { createUploader } = require('../config/cloudinary');

const reviewPhotoUploader = createUploader('reviews', 'photos', 5);

// ── Reviews ───────────────────────────────────────────────
router.post('/reviews',                authenticate, reviewPhotoUploader, reviewValidators.create, validate, reviewCtrl.createReview);
router.get('/reviews/property/:propertyId',                                reviewCtrl.getPropertyReviews);
router.patch('/reviews/:id/reply',     authenticate, requireRole('HOST'),  reviewCtrl.addHostReply);
router.delete('/reviews/:id',          authenticate, requireRole('ADMIN'), reviewCtrl.removeReview);

// ── Wishlist ──────────────────────────────────────────────
router.get('/wishlist',                authenticate, wishlistCtrl.getWishlist);
router.post('/wishlist',               authenticate, wishlistCtrl.addToWishlist);
router.delete('/wishlist/:propertyId', authenticate, wishlistCtrl.removeFromWishlist);

module.exports = router;
