const reviewService = require('../services/reviewService');

const createReview = async (req, res) => {
  const photos = (req.files || []).map((f) => f.path);
  const review = await reviewService.createReview({ ...req.body, guestId: req.user.id, photos });
  res.status(201).json({ success: true, data: review });
};

const getPropertyReviews = async (req, res) => {
  const result = await reviewService.getPropertyReviews(req.params.propertyId, req.query.page, req.query.limit);
  res.json({ success: true, data: result });
};

const addHostReply = async (req, res) => {
  const review = await reviewService.addHostReply(req.params.id, req.user.id, req.body.reply);
  res.json({ success: true, data: review });
};

const removeReview = async (req, res) => {
  await reviewService.removeReview(req.params.id);
  res.json({ success: true, message: 'Review removed' });
};

module.exports = { createReview, getPropertyReviews, addHostReply, removeReview };
