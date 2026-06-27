import Driver from '../models/Driver.js';
import generateToken from '../utils/generateToken.js';

// @desc    Driver login
// @route   POST /api/drivers/login
// @access  Public
const driverLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email va parol kiritilishi shart'
      });
    }

    const driver = await Driver.findOne({ email });

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: "Email yoki parol noto'g'ri"
      });
    }

    if (driver.status === 'Nofaol') {
      return res.status(401).json({
        success: false,
        message: "Hisobingiz nofaol. Admin bilan bog'laning."
      });
    }

    const isMatch = await driver.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email yoki parol noto'g'ri"
      });
    }

    generateToken(res, driver._id);

    res.json({
      success: true,
      data: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: 'driver',
        status: driver.status,
        vehicleType: driver.vehicleType,
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi', error: error.message });
  }
};

export { driverLogin };