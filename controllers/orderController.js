import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Buyurtma yaratish
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { cargoType, weight, from, to, clientName, clientPhone } = req.body;

    if (!cargoType || !weight || !from || !to) {
      return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
    }

    const order = await Order.create({
      cargoType,
      weight,
      from,
      to,
      clientName: clientName || '',
      clientPhone: clientPhone || '',
      client: req.user?._id || null,
      status: 'Yangi'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Barcha buyurtmalar
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('driver', 'name email phone')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Tracking ID bilan qidirish
// @route   GET /api/orders/track/:trackingId
// @access  Public
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ trackingId: req.params.trackingId })
      .populate('driver', 'name phone');

    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Buyurtmani yangilash (holat, driver, narx)
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }

    const { status, driver, price } = req.body;
    if (status) order.status = status;
    if (driver !== undefined) order.driver = driver || null;
    if (price !== undefined) order.price = price;

    const updated = await order.save();
    const populated = await updated.populate('driver', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Buyurtmani o'chirish
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }
    await Order.deleteOne({ _id: order._id });
    res.json({ message: "Buyurtma o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Klientlar ro'yxati (role: user)
// @route   GET /api/orders/clients
// @access  Private/Admin
const getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'user' })
      .select('-password -verificationCode -verificationExpire')
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

export { createOrder, getOrders, trackOrder, updateOrder, deleteOrder, getClients };