import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Yuk ma'lumotlari
  cargoType: { type: String, required: true },
  weight: { type: Number, required: true },

  // Yo'nalish
  from: { type: String, required: true },
  to: { type: String, required: true },

  // Mijoz ma'lumotlari
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  clientName: { type: String },
  clientPhone: { type: String },

  // Driver
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Holat
  status: {
    type: String,
    enum: ['Yangi', 'Qabul qilindi', 'Yo\'lda', 'Yetkazildi', 'Bekor qilindi'],
    default: 'Yangi'
  },

  // Tracking ID
  trackingId: {
    type: String,
    unique: true
  },

  // Narx
  price: { type: Number, default: 0 },

}, { timestamps: true });

// Tracking ID avtomatik generatsiya
orderSchema.pre('save', async function() {
  if (!this.trackingId) {
    this.trackingId = 'LOG' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;