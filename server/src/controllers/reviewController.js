const mongoose = require('mongoose');
const BreakdownRequest = require('../models/BreakdownRequest');
const Review = require('../models/Review');
const { AppError, asyncHandler } = require('../utils/helpers');
const { notify } = require('../utils/notify');

// POST /api/requests/:id/review  (customer, only after the request is Resolved, once)
exports.create = asyncHandler(async (req, res) => {
  const request = await BreakdownRequest.findOne({ _id: req.params.id, customer: req.user._id });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'Resolved') throw new AppError('You can rate a service only after it is resolved', 400);
  if (!request.provider) throw new AppError('This request has no provider to rate', 400);
  if (await Review.exists({ request: request._id })) throw new AppError('You have already rated this service', 409);

  const review = await Review.create({
    request: request._id,
    customer: req.user._id,
    provider: request.provider,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  await notify(request.provider, `You received a ${review.rating}-star rating`, request._id);
  res.status(201).json({ success: true, data: { review } });
});

// GET /api/reviews/summary  (provider: average rating and latest comments)
exports.summary = asyncHandler(async (req, res) => {
  const [stats] = await Review.aggregate([
    { $match: { provider: new mongoose.Types.ObjectId(req.user._id) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const recent = await Review.find({ provider: req.user._id }).sort('-createdAt').limit(5).populate('customer', 'name');
  res.json({
    success: true,
    data: { average: stats ? Math.round(stats.average * 10) / 10 : null, count: stats ? stats.count : 0, recent },
  });
});
