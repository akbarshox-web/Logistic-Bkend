import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import settingRoutes from './routes/settingRoutes.js';

dotenv.config();

const app = express();

// ✅ Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Rate limiter — faqat API uchun
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 300, // Maksimal so'rovlar
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Juda ko'p so'rov yuborildi. Iltimos, biroz kuting."
  },
});
app.use('/api', limiter);

// ✅ CORS — dinamik ravishda CLIENT_URL va PRODUCTION_URLS dan o'qiydi
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const envOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.PRODUCTION_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
].filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

console.log('✅ CORS uchun ruxsat berilgan originlar:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman, server-to-server, yoki origin yo'q bo'lsa
      if (!origin) {
        return callback(null, true);
      }

      // Aniq ro'yxatdan tekshirish
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Vercel preview URL lari uchun
      // Masalan: logistic-frontend-abc123xyz.vercel.app
      if (/^https:\/\/logistic[a-z0-9-]*\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }

      console.warn(`⚠️ CORS bloklandi: ${origin}`);
      callback(new Error(`CORS: ${origin} dan so'rov qabul qilinmaydi`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 soat
  })
);

// ✅ Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LogisticPro API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API sog\'lom',
    database: 'connected' // TODO: mongoose.connection.readyState
  });
});

// ✅ API routes
app.use('/api/users', userRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/settings', settingRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint topilmadi: ${req.method} ${req.originalUrl}`
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server xatoligi:', err.message);
  console.error(err.stack);

  // CORS xatoligi
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS xatoligi: So\'rov qabul qilinmadi'
    });
  }

  // JWT/Cookie xatoligi
  if (err.message && (err.message.includes('jwt') || err.message.includes('cookie'))) {
    return res.status(401).json({
      success: false,
      message: 'Autentifikatsiya xatoligi'
    });
  }

  // JSON parse xatoligi
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Noto\'g\'ri JSON format'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server xatoligi yuz berdi',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server muvaffaqiyatli ishga tushdi!`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔐 CORS: ${allowedOrigins.length} ta origin'ga ruxsat berilgan`);
      console.log(`📅 Vaqt: ${new Date().toLocaleString('uz-UZ')}\n`);
    });
  } catch (error) {
    console.error('\n❌ Server ishga tushmadi.');
    console.error('MongoDB ulanmagan:', error.message);
    console.error('\n💡 Yechim:');
    console.error('   1. .env fayldagi MONGO_URI ni tekshiring');
    console.error('   2. MongoDB Atlas da IP whitelist ga qo\'shing');
    console.error('   3. Internet aloqasini tekshiring\n');
    process.exit(1);
  }
};

startServer();