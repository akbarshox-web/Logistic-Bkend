import Order from '../models/Order.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/dbMiddleware.js';
import { logActivity, getClientIp } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notificationHelper.js';

// ✅ DB holatini tekshirish helper
const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Ma'lumotlar bazasi bilan aloqa yo'q"
    });
  }
  return null;
};

// ✅ Timeline event qo'shish helper
const pushTimeline = (order, status, note, byName) => {
  order.timeline.push({
    status,
    note: note || '',
    byName: byName || 'Tizim',
    createdAt: new Date(),
  });
};

// @desc    Buyurtma yaratish
const createOrder = asyncHandler(async (req, res) => {
  const dbError = checkDB(res);
  if (dbError) return;

  const { cargoType, weight, from, to, clientName, clientPhone } = req.body;

  if (!cargoType || !weight || !from || !to) {
    return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring" });
  }

  const order = await Order.create({
    cargoType,
    weight: Number(weight),
    from,
    to,
    clientName: clientName || '',
    clientPhone: clientPhone || '',
    client: req.user?._id || null,
    status: 'Yangi',
    timeline: [
      {
        status: 'Yangi',
        note: 'Buyurtma yaratildi',
        byName: req.user?.name || 'Mehmon',
        createdAt: new Date(),
      },
    ],
  });

  // Mijozga bildirishnoma
  if (order.client) {
    await createNotification({
      user: order.client,
      type: 'order_created',
      title: 'Yangi buyurtma yaratildi',
      message: `Buyurtma #${order.trackingId} muvaffaqiyatli yaratildi`,
      data: { orderId: order._id, trackingId: order.trackingId },
    });
  }

  await logActivity({
    type: 'order_created',
    actor: req.user?._id,
    actorRole: req.user?.role || 'user',
    actorName: req.user?.name || clientName || 'Mehmon',
    targetType: 'order',
    targetId: order._id,
    targetName: order.trackingId,
    description: `Yangi buyurtma: ${from} → ${to}`,
    ip: getClientIp(req),
  });

  res.status(201).json({ success: true, data: order });
});

// @desc    Barcha buyurtmalar (admin)
const getOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const status = req.query.status;
  const search = req.query.search;

  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [
      { trackingId: re },
      { from: re },
      { to: re },
      { clientName: re },
      { clientPhone: re },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('driver', 'name email phone avatar vehicleType isOnline')
      .populate('client', 'name email avatar phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Klientning o'z buyurtmalari
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ client: req.user._id })
    .populate('driver', 'name phone vehicleType')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

// @desc    Tracking ID bilan qidirish
const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ trackingId: req.params.trackingId })
    .populate('driver', 'name phone vehicleType');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
  }
  res.json({ success: true, data: order });
});

// @desc    Buyurtmani yangilash (admin)
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
  }

  const { status, driver, price, note } = req.body;
  const previousStatus = order.status;

  if (status && status !== order.status) {
    pushTimeline(order, status, note || `Status "${order.status}" dan "${status}" ga o'zgartirildi`, req.user?.name || 'Admin');

    // Mijozga bildirishnoma
    if (order.client) {
      const typeMap = {
        'Qabul qilindi': 'order_accepted',
        "Yo'lda": 'order_in_transit',
        'Yetkazildi': 'order_delivered',
        'Bekor qilindi': 'order_cancelled',
      };
      await createNotification({
        user: order.client,
        type: typeMap[status] || 'order_updated',
        title: `Buyurtma #${order.trackingId}`,
        message: `Holat: ${status}`,
        data: { orderId: order._id, trackingId: order.trackingId, status },
      });
    }
    order.status = status;
  }
  if (driver !== undefined) order.driver = driver || null;
  if (price !== undefined) order.price = Number(price);

  const updated = await order.save();
  const populated = await updated.populate('driver', 'name email phone avatar vehicleType isOnline');

  await logActivity({
    type: previousStatus !== order.status ? 'order_status_changed' : 'order_updated',
    actor: req.user._id,
    actorRole: req.user.role,
    actorName: req.user.name,
    targetType: 'order',
    targetId: order._id,
    targetName: order.trackingId,
    description: `Buyurtma #${order.trackingId} yangilandi`,
    metadata: { previousStatus, newStatus: order.status },
    ip: getClientIp(req),
  });

  res.json({ success: true, data: populated });
});

// @desc    Buyurtmani o'chirish
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
  }

  const trackingId = order.trackingId;
  await Order.deleteOne({ _id: order._id });

  await logActivity({
    type: 'order_deleted',
    actor: req.user._id,
    actorRole: req.user.role,
    actorName: req.user.name,
    targetType: 'order',
    targetName: trackingId,
    description: `Buyurtma #${trackingId} o'chirildi`,
    ip: getClientIp(req),
  });

  res.json({ success: true, message: "Buyurtma o'chirildi" });
});

// @desc    Klientlar ro'yxati
const getClients = asyncHandler(async (req, res) => {
  const clients = await User.find({ role: 'user' })
    .select('-password -verificationCode -verificationExpire')
    .sort({ createdAt: -1 });

  // Har bir klient uchun buyurtmalar soni va oxirgi buyurtma
  const clientIds = clients.map((c) => c._id);
  const orderStats = await Order.aggregate([
    { $match: { client: { $in: clientIds } } },
    {
      $group: {
        _id: '$client',
        count: { $sum: 1 },
        lastOrder: { $max: '$createdAt' },
        lastOrderId: { $last: '$_id' },
        lastOrderStatus: { $last: '$status' },
        lastOrderTracking: { $last: '$trackingId' },
        totalSpent: { $sum: { $ifNull: ['$price', 0] } },
      },
    },
  ]);

  const statsMap = new Map(orderStats.map((s) => [String(s._id), s]));

  const enriched = clients.map((c) => {
    const obj = c.toObject();
    const s = statsMap.get(String(c._id));
    return {
      ...obj,
      ordersCount: s?.count || 0,
      totalSpent: s?.totalSpent || 0,
      lastOrder: s ? {
        _id: s.lastOrderId,
        trackingId: s.lastOrderTracking,
        status: s.lastOrderStatus,
        createdAt: s.lastOrder,
      } : null,
    };
  });

  res.json({ success: true, data: enriched });
});

// @desc    Dashboard statistikasi (admin)
// @route   GET /api/orders/stats/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    todayOrders,
    monthOrders,
    lastMonthOrders,
    ordersByStatus,
    totalClients,
    totalDrivers,
    onlineDrivers,
    totalRevenue,
    monthRevenue,
    recentOrders,
    ordersByDay,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: 'user' }),
    Driver.countDocuments({}),
    Driver.countDocuments({ isOnline: true }),
    Order.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$price', 0] } } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$price', 0] } } } },
    ]),
    Order.find({})
      .populate('driver', 'name')
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$price', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const monthGrowth = lastMonthOrders > 0
    ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      totals: {
        orders: totalOrders,
        today: todayOrders,
        month: monthOrders,
        lastMonth: lastMonthOrders,
        monthGrowth,
        clients: totalClients,
        drivers: totalDrivers,
        onlineDrivers,
        revenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
      },
      ordersByStatus: ordersByStatus.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      recentOrders,
      ordersByDay,
    },
  });
});

export {
  createOrder,
  getOrders,
  getMyOrders,
  trackOrder,
  updateOrder,
  deleteOrder,
  getClients,
  getDashboardStats,
};