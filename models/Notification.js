import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Kimga yuborilgan
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Turi
  type: {
    type: String,
    enum: [
      'order_created',
      'order_accepted',
      'order_in_transit',
      'order_delivered',
      'order_cancelled',
      'driver_assigned',
      'system',
      'promo',
    ],
    default: 'system',
  },
  // Sarlavha
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  // Xabar matni
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  // Qo'shimcha ma'lumot (ixtiyoriy)
  // Masalan: order ID, link va h.k.
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // O'qilgan/o'qilmagan
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// ✅ Eng yangi bildirishnomalar tepada
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;