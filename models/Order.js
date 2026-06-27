import mongoose from 'mongoose';

/**
 * ✅ Timeline event — buyurtma holati o'zgarganda yoziladi
 * Har bir event'da: status, izoh, vaqt, kim tomonidan
 */
const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Yangi', 'Qabul qilindi', "Yo'lda", 'Yetkazildi', 'Bekor qilindi'],
    required: true,
  },
  note: {
    type: String,
    default: '',
    maxlength: 500,
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  byName: {
    type: String,
    default: 'Tizim',
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

const orderSchema = new mongoose.Schema({
  cargoType: { type: String, required: true },
  weight: { type: Number, required: true },

  from: { type: String, required: true },
  to: { type: String, required: true },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  clientName: { type: String },
  clientPhone: { type: String },

  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  status: {
    type: String,
    enum: ['Yangi', 'Qabul qilindi', 'Yo\'lda', 'Yetkazildi', 'Bekor qilindi'],
    default: 'Yangi',
    index: true,
  },

  trackingId: {
    type: String,
    unique: true,
    default: function() {
      return 'LOG' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
    }
  },

  price: { type: Number, default: 0 },

  // ✅ Timeline — buyurtma holati tarixi
  timeline: [timelineEventSchema],

}, { timestamps: true });

// ✅ Yangi buyurtma yaratilganda avtomatik "Yangi" event qo'shish
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      status: 'Yangi',
      note: 'Buyurtma yaratildi',
      byName: 'Tizim',
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;