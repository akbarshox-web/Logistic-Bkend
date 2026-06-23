import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // Faqat userlarni o'chiradi (partnerlar saqlanib qoladi)
    await User.deleteMany();

    // ✅ User.create() ishlatilganda pre('save') hook ishlaydi
    // ya'ni parol avtomatik bcrypt bilan hash qilinadi
    const adminUser = await User.create({
      name: 'Akbarshox Admin',
      email: process.env.ADMIN_EMAIL || 'sunnatmaxkambayev53@gmail.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345!',
      role: 'superadmin',
      isVerified: true
    });

    console.log('✅ Superadmin yaratildi!');
    console.log(`   Nomi: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('');
    console.log('⚠️  Parolni .env da SEED_ADMIN_PASSWORD orqali o\'zgartiring!');

    process.exit();
  } catch (error) {
    console.error(`❌ Xato: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    console.log('🗑️  Barcha foydalanuvchilar o\'chirildi!');
    process.exit();
  } catch (error) {
    console.error(`❌ Xato: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}