import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // First try local MongoDB, then fall back to Atlas
    const mongoURI = process.env.DB_URI || 'mongodb://localhost:27017/logistic';

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB xatolik: ${error.message}`);
    // Try local MongoDB as fallback
    try {
      const conn = await mongoose.connect('mongodb://localhost:27017/logistic', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`MongoDB Connected (local): ${conn.connection.host}`);
    } catch (localError) {
      console.log('Local MongoDB ham ishlamaydi. Iltimos MongoDB ni o\'rnating yoki Atlas da IP ni whitelist qiling.');
      console.log('Server is continuing without database connection...');
    }
  }
};

export default connectDB;
