import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Security
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Juda ko'p so'rov yuborildi, iltimos keyinroq urinib ko'ring."
});
app.use('/api', limiter);

// ✅ CORS: Vite proxy ishlatilsa bu kerak emas, lekin to'g'ri sozlangan
// Development: http://localhost:5173
// Production: o'z domeningiz
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Serverdan serverga so'rovlar (origin yo'q) yoki ruxsat berilgan origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS xatosi: ruxsat berilmagan origin'));
    }
  },
  credentials: true, // ✅ cookie yuborish uchun shart
}));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/partners', partnerRoutes);

app.get('/', (req, res) => {
  res.send('Logistic API is running...');
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server xatoligi' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});