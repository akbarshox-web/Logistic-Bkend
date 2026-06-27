import mongoose from 'mongoose';

/**
 * ✅ MongoDB ulanishini tekshiruvchi middleware
 * Controller'ga kirishdan oldin DB tayyorligini tekshiradi
 */
export const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Ma\'lumotlar bazasi bilan aloqa yo\'q. Iltimos, keyinroq urinib ko\'ring.',
      error: 'DATABASE_DISCONNECTED'
    });
  }
  next();
};

/**
 * ✅ Async controller uchun universal error catcher
 * try/catch yozmaslik uchun
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`❌ ${req.method} ${req.originalUrl}:`, error.message);

    // Mongo duplicate key
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'maydon';
      return res.status(400).json({
        success: false,
        message: `Bu ${field} allaqachon mavjud`
      });
    }

    // Mongo validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ') || 'Ma\'lumotlar noto\'g\'ri'
      });
    }

    // Mongo CastError (noto'g'ri ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri ID format'
      });
    }

    // JWT xatolari
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token yaroqsiz'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token muddati o\'tgan'
      });
    }

    // Standart xato
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server xatoligi',
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  });
};