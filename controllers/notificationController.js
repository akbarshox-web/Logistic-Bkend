import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/dbMiddleware.js';

// @desc    Foydalanuvchining bildirishnomalari
// @route   GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const unreadOnly = req.query.unread === 'true';

  const filter = { user: req.user._id };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: items,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Bitta bildirishnoma
// @route   GET /api/notifications/:id
const getNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notif) return res.status(404).json({ success: false, message: 'Bildirishnoma topilmadi' });
  res.json({ success: true, data: notif });
});

// @desc    Bildirishnomani o'qilgan deb belgilash
// @route   PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notif) return res.status(404).json({ success: false, message: 'Bildirishnoma topilmadi' });

  notif.isRead = true;
  notif.readAt = new Date();
  await notif.save();

  res.json({ success: true, data: notif });
});

// @desc    Hammasini o'qilgan deb belgilash
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({ success: true, message: 'Hammasi o\'qildi' });
});

// @desc    Bildirishnomani o'chirish
// @route   DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notif) return res.status(404).json({ success: false, message: 'Bildirishnoma topilmadi' });
  await Notification.deleteOne({ _id: notif._id });
  res.json({ success: true, message: 'Bildirishnoma o\'chirildi' });
});

// @desc    Hammasini o'chirish
// @route   DELETE /api/notifications/all
const deleteAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ success: true, message: 'Hammasi o\'chirildi' });
});

// @desc    Admin uchun — bildirishnoma yuborish
// @route   POST /api/notifications
const createNotification = asyncHandler(async (req, res) => {
  const { userId, type, title, message, data } = req.body;

  if (!userId || !title || !message) {
    return res.status(400).json({
      success: false,
      message: 'userId, title, message kiritilishi shart',
    });
  }

  const notif = await Notification.create({
    user: userId,
    type: type || 'system',
    title,
    message,
    data: data || {},
  });

  res.status(201).json({ success: true, data: notif });
});

export {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAll,
  createNotification,
};