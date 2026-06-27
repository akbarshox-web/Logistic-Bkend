import Review from '../models/Review.js';
import { asyncHandler } from '../middleware/dbMiddleware.js';
import { logActivity, getClientIp } from '../utils/activityLogger.js';

// @desc    Faol fikrlar (public)
// @route   GET /api/reviews
const getReviews = asyncHandler(async (req, res) => {
  const filter = { isApproved: true, isVisible: true };
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(50);
  // Faqat kerakli maydonlarni qaytaramiz
  const safe = reviews.map((r) => ({
    _id: r._id,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));
  res.json({ success: true, data: safe });
});

// @desc    Bitta fikr
// @route   GET /api/reviews/:id
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Fikr topilmadi' });
  res.json({ success: true, data: review });
});

// @desc    Yangi fikr qo'shish (login bo'lgan user)
// @route   POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, order } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Reyting va izoh kiritilishi shart',
    });
  }

  const rate = Number(rating);
  if (rate < 1 || rate > 5) {
    return res.status(400).json({
      success: false,
      message: 'Reyting 1 dan 5 gacha bo\'lishi kerak',
    });
  }

  const review = await Review.create({
    user: req.user._id,
    userName: req.user.name,
    rating: rate,
    comment,
    order: order || null,
  });

  await logActivity({
    type: 'review_posted',
    actor: req.user._id,
    actorRole: req.user.role,
    actorName: req.user.name,
    targetType: 'review',
    targetId: review._id,
    description: `${rate} yulduzli fikr qoldirdi`,
    metadata: { rating: rate },
    ip: getClientIp(req),
  });

  res.status(201).json({ success: true, data: review });
});

// @desc    Fikrni tasdiqlash/yashirish (admin)
// @route   PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Fikr topilmadi' });

  if (req.body.isApproved !== undefined) review.isApproved = req.body.isApproved;
  if (req.body.isVisible !== undefined) review.isVisible = req.body.isVisible;
  if (req.body.rating) review.rating = Number(req.body.rating);
  if (req.body.comment) review.comment = req.body.comment;

  const updated = await review.save();
  res.json({ success: true, data: updated });
});

// @desc    Fikrni o'chirish (admin yoki egasi)
// @route   DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Fikr topilmadi' });

  // Faqat admin yoki egasi o'chira oladi
  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });
  }

  await Review.deleteOne({ _id: review._id });
  res.json({ success: true, message: 'Fikr o\'chirildi' });
});

// @desc    Barcha fikrlar (admin)
// @route   GET /api/reviews/admin/all
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

export { getReviews, getReview, createReview, updateReview, deleteReview, getAllReviews };