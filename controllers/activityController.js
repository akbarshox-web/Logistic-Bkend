import Activity from '../models/Activity.js';
import { asyncHandler } from '../middleware/dbMiddleware.js';

// @desc    Faoliyat tarixini olish (admin)
// @route   GET /api/activities
const getActivities = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const type = req.query.type;
  const search = req.query.search;

  const filter = {};
  if (type) filter.type = type;
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ description: re }, { actorName: re }, { targetName: re }];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Activity.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Faoliyat turlari statistikasi (admin)
// @route   GET /api/activities/stats
const getActivityStats = asyncHandler(async (req, res) => {
  const stats = await Activity.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byDay = await Activity.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
  ]);

  res.json({
    success: true,
    data: {
      byType: stats,
      byDay: byDay.reverse(),
    },
  });
});

// @desc    So'nggi faoliyatlar
// @route   GET /api/activities/recent
const getRecent = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const items = await Activity.find({}).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, data: items });
});

// @desc    Faoliyatni o'chirish (admin)
// @route   DELETE /api/activities/:id
const deleteActivity = asyncHandler(async (req, res) => {
  const a = await Activity.findById(req.params.id);
  if (!a) return res.status(404).json({ success: false, message: 'Faoliyat topilmadi' });
  await Activity.deleteOne({ _id: a._id });
  res.json({ success: true, message: 'Faoliyat o\'chirildi' });
});

// @desc    Hammasini tozalash (admin)
// @route   DELETE /api/activities/all
const clearAll = asyncHandler(async (req, res) => {
  await Activity.deleteMany({});
  res.json({ success: true, message: 'Faoliyat tarixi tozalandi' });
});

export { getActivities, getActivityStats, getRecent, deleteActivity, clearAll };