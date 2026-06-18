import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await User.deleteMany();

    const adminUser = await User.create({
      name: 'Akbarshox Admin',
      email: 'ergashevakbarshox2010@gmail.com',
      password: 'admin123password', // Bu parolni keyinchalik o'zgartirish tavsiya etiladi
      role: 'superadmin',
      isVerified: true
    });

    console.log('Ma\'lumotlar muvaffaqiyatli import qilindi!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    console.log('Ma\'lumotlar o\'chirildi!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
