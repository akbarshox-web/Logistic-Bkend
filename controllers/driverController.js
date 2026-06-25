import Driver from '../models/Driver.js';

// @desc    Barcha driverlar
// @route   GET /api/drivers
// @access  Private/Admin
const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({}).select('-password').sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Driver yaratish
// @route   POST /api/drivers
// @access  Private/Admin
const createDriver = async (req, res) => {
  try {
    const { name, email, phone, password, licenseNumber, vehicleType } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Barcha majburiy maydonlarni to'ldiring" });
    }

    const exists = await Driver.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Bu email allaqachon mavjud' });
    }

    const driver = await Driver.create({
      name, email, phone, password,
      licenseNumber: licenseNumber || '',
      vehicleType: vehicleType || 'Yuk mashinasi',
    });

    res.status(201).json({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      status: driver.status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Driver holatini yangilash
// @route   PUT /api/drivers/:id
// @access  Private/Admin
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Haydovchi topilmadi' });
    }

    const { name, phone, status, licenseNumber, vehicleType } = req.body;
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (status) driver.status = status;
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
    if (vehicleType) driver.vehicleType = vehicleType;

    const updated = await driver.save();
    res.json({ ...updated.toObject(), password: undefined });
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Driver o'chirish
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Haydovchi topilmadi' });
    }
    await Driver.deleteOne({ _id: driver._id });
    res.json({ message: "Haydovchi o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

export { getDrivers, createDriver, updateDriver, deleteDriver };