import mongoose from 'mongoose';

/**
 * ✅ Settings modeli — singleton pattern
 * Faqat bitta hujjat bo'ladi (sayt sozlamalari)
 */
const settingsSchema = new mongoose.Schema({
  // Sayt nomi
  siteName: {
    type: String,
    default: 'LogisticPro',
    trim: true,
  },
  // Sayt tavsifi
  siteDescription: {
    type: String,
    default: 'Zamonaviy logistika va yuk tashish xizmati',
    trim: true,
    maxlength: 500,
  },
  // Aloqa ma'lumotlari
  contact: {
    email: { type: String, default: 'info@logisticpro.uz', trim: true },
    phone: { type: String, default: '+998 71 200 00 00', trim: true },
    address: { type: String, default: 'Toshkent, O\'zbekiston', trim: true },
    workingHours: { type: String, default: 'Dush-Shan, 9:00 - 18:00', trim: true },
  },
  // Ijtimoiy tarmoqlar
  social: {
    facebook: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    telegram: { type: String, default: '', trim: true },
    youtube: { type: String, default: '', trim: true },
  },
  // SMTP sozlamalari (email yuborish uchun)
  smtp: {
    host: { type: String, default: '', trim: true },
    port: { type: Number, default: 587 },
    user: { type: String, default: '', trim: true },
    pass: { type: String, default: '', trim: true },
    fromName: { type: String, default: 'LogisticPro', trim: true },
    fromEmail: { type: String, default: 'noreply@logisticpro.uz', trim: true },
  },
  // Narx va logistika sozlamalari
  pricing: {
    basePricePerKg: { type: Number, default: 5000 },
    pricePerKm: { type: Number, default: 2000 },
    currency: { type: String, default: 'UZS', trim: true },
  },
  // Tizim sozlamalari
  system: {
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    maxOrdersPerUser: { type: Number, default: 100 },
  },
}, {
  timestamps: true,
});

// ✅ Singleton: birinchi hujjatni olish/yaratish
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Setting = mongoose.model('Setting', settingsSchema);
export default Setting;