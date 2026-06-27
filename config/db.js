import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.DB_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI yoki DB_URI .env faylda topilmadi');
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB xatolik: ${error.message}`);
    throw error;
  }
};

export default connectDB;