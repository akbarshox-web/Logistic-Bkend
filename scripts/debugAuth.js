import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const debugAuth = async () => {
  try {
    console.log('🔌 MongoDB ga ulanish...');
    await connectDB();
    console.log('✅ Ulangan!\n');

    const allUsers = await User.find({}).select('name email role isVerified');
    console.log(`📋 Jami userlar: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('⚠️  Hech qanday user topilmadi!');
      console.log('   npm run data:import — superadmin yaratish uchun\n');
    } else {
      allUsers.forEach((u, i) => {
        const status = u.role === 'admin' || u.role === 'superadmin' ? '👑' : '👤';
        console.log(`${status} ${i + 1}. ${u.name}`);
        console.log(`     Email:      ${u.email}`);
        console.log(`     Role:       ${u.role}`);
        console.log(`     Verified:   ${u.isVerified ? '✅' : '❌'}`);
        console.log('');
      });

      const admins = allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
      if (admins.length === 0) {
        console.log('❌ ADMIN TOPILMADI!');
        console.log('   Tuzatish: npm run make:admin <email> superadmin');
        console.log('   Yoki:    npm run data:import — yangi superadmin yaratish\n');
      } else {
        console.log(`✅ ${admins.length} ta admin topildi.\n`);
      }
    }

    await mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error('\n❌ XATO:', error.message);
    console.error('\n💡 Yechimlar:');
    console.error('   1. MongoDB Atlas → Network Access → IP whitelist ga qo\'shing');
    console.error('   2. .env dagi MONGO_URI ni tekshiring');
    console.error('   3. Internet aloqasini tekshiring');
    process.exit(1);
  }
};

debugAuth();
