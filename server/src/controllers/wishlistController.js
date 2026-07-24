const wishlistService = require('../services/wishlistService');

const getWishlist = async (req, res) => {
  const items = await wishlistService.getWishlist(req.user.id);
  res.json({ success: true, data: items });
};

const addToWishlist = async (req, res) => {
  await wishlistService.addToWishlist(req.user.id, req.body.propertyId);
  res.status(201).json({ success: true, message: 'Added to wishlist' });
};

const removeFromWishlist = async (req, res) => {
  await wishlistService.removeFromWishlist(req.user.id, req.params.propertyId);
  res.json({ success: true, message: 'Removed from wishlist' });
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
