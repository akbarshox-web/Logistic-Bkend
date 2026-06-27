import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  // Faoliyat turi
  type: {
    type: String,
    enum: [
      'user_registered',
      'user_login',
      'user_logout',
      'order_created',
      'order_updated',
      'order_deleted',
      'order_status_changed',
      'driver_created',
      'driver_updated',
      'driver_deleted',
      'admin_created',
      'admin_deleted',
      'partner_created',
      'partner_deleted',
      'review_posted',
      'contact_message',
      'settings_updated',
    ],
    required: true,
    index: true,
  },
  // Faoliyat qilgan foydalanuvchi
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Aktyorning roli (snapshot)
  actorRole: {
    type: String,
    enum: ['user', 'admin', 'superadmin', 'driver', 'system'],
    default: 'system',
  },
  // Aktyorning nomi (snapshot)
  actorName: {
    type: String,
    default: '',
  },
  // Ta'sir qilingan obyekt (order, user va h.k.)
  targetType: {
    type: String,
    enum: ['order', 'user', 'driver', 'partner', 'review', 'contact', 'settings', 'system'],
    default: 'system',
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // Ta'sir qilingan obyektning nomi (snapshot)
  targetName: {
    type: String,
    default: '',
  },
  // Tavsif
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  // Qo'shimcha metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // IP manzil (audit uchun)
  ip: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// ✅ Eng yangi faoliyatlar tepada
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;