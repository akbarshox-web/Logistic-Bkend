import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const makeAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2] || process.env.ADMIN_EMAIL || 'sunnatmaxkambayev53@gmail.com';
    const role = process.argv[3] || 'superadmin';

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ Foydalanuvchi topilmadi: ${email}`);
      console.log('   Avval ro\'yxatdan o\'ting yoki seeder ishlatib admin yarating.');
      process.exit(1);
    }

    user.role = role;
    user.isVerified = true;
    await user.save();

    console.log(`✅ Foydalanuvchi admin qilindi!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name:  ${user.name}`);
    console.log(`   Role:  ${user.role}`);
    console.log('');
    console.log('🔄 Endi login qilib qayta kiring (eski token ishlamasligi mumkin).');

    await mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error('XATO:', error.message);
    process.exit(1);
  }
};

makeAdmin();
