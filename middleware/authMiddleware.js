import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';

// ✅ Universal protect: User ham Driver ham kira oladi
const protect = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Token yo'q, kirish taqiqlangan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Avval User dan qidirish
    let user = await User.findById(decoded.userId).select('-password');

    // Topilmasa Driver dan qidirish
    if (!user) {
      user = await Driver.findById(decoded.userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token xato yoki muddati o'tgan" });
  }
};

// ✅ Admin va Superadmin
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ message: "Admin huquqi yo'q" });
  }
};

// ✅ Faqat Superadmin
const superadminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: "Superadmin huquqi yo'q" });
  }
};

// ✅ Driver middleware — faqat driver kira oladi
const driverAuth = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    res.status(403).json({ message: "Haydovchi huquqi yo'q" });
  }
};

export { protect, admin, superadminOnly, driverAuth };