import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';

const protect = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    res.status(401).json({ message: "Avtorizatsiyadan o'tilmagan, token yo'q" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: avval User, keyin Driver modelidan qidirish
    let user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      user = await Driver.findById(decoded.userId).select('-password');
    }

    if (!user) {
      res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token xato yoki muddati o'tgan" });
  }
};

// ✅ FIX: admin HAM superadmin HAM kira oladi
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ message: "Admin huquqi yo'q" });
  }
};

// Faqat superadmin uchun
const superadminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: "Superadmin huquqi yo'q" });
  }
};

export { protect, admin, superadminOnly };