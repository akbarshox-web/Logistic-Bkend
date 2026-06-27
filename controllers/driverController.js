import Driver from '../models/Driver.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// ✅ DB holatini tekshirish helper
const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Ma'lumotlar bazasi bilan aloqa yo'q"
    });
    return false;
  }
  return true;
};

// @desc    Barcha driverlar
// @route   GET /api/drivers
// @access  Private/Admin
const getDrivers = async (req, res) => {
  try {
    if (!checkDB(res)) return;
    const drivers = await Driver.find({}).select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
  }
};

// @desc    Driver yaratish
// @route   POST /api/drivers
// @access  Private/Admin
const createDriver = async (req, res) => {
  try {
    if (!checkDB(res)) return;

    const { name, email, phone, password, licenseNumber, vehicleType } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Barcha majburiy maydonlarni to'ldiring"
      });
    }

    const exists = await Driver.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Bu email allaqachon mavjud'
      });
    }

    const driver = await Driver.create({
      name, email, phone, password,
      licenseNumber: licenseNumber || '',
      vehicleType: vehicleType || 'Yuk mashinasi',
    });

    res.status(201).json({
      success: true,
      data: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        status: driver.status,
      }
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Driver yangilash (holat, ma'lumotlar)
// @route   PUT /api/drivers/:id
// @access  Private/Admin
const updateDriver = async (req, res) => {
  try {
    if (!checkDB(res)) return;

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Haydovchi topilmadi' });
    }

    const { name, phone, status, licenseNumber, vehicleType } = req.body;
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (status) driver.status = status;
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
    if (vehicleType) driver.vehicleType = vehicleType;

    const updated = await driver.save();
    const obj = updated.toObject();
    delete obj.password;
    res.json({ success: true, data: obj });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
  }
};

// @desc    Driver o'chirish
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = async (req, res) => {
  try {
    if (!checkDB(res)) return;

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Haydovchi topilmadi' });
    }
    await Driver.deleteOne({ _id: driver._id });
    res.json({ success: true, message: "Haydovchi o'chirildi" });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
  }
};

// @desc    Driver o'zining buyurtmalarini oladi
// @route   GET /api/drivers/my-orders
// @access  Private/Driver
const getMyOrders = async (req, res) => {
  try {
    if (!checkDB(res)) return;

    const driver = await Driver.findOne({ email: req.user.email });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Haydovchi topilmadi' });
    }

    const orders = await Order.find({ driver: driver._id })
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Driver buyurtma holatini yangilaydi
// @route   PUT /api/drivers/orders/:orderId
// @access  Private/Driver
const updateOrderStatus = async (req, res) => {
  try {
    if (!checkDB(res)) return;

    const driver = await Driver.findOne({ email: req.user.email });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Haydovchi topilmadi' });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      driver: driver._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Buyurtma topilmadi yoki sizga tegishli emas" });
    }

    const { status } = req.body;
    const allowedStatuses = ['Qabul qilindi', "Yo'lda", 'Yetkazildi'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Noto'g'ri holat" });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: { _id: order._id, status: order.status, trackingId: order.trackingId }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi', error: error.message });
  }
};

export { getDrivers, createDriver, updateDriver, deleteDriver, getMyOrders, updateOrderStatus };