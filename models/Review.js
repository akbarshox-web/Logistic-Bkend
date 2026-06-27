import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // Mijoz
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Foydalanuvchi nomi (snapshot)
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  // Reyting (1-5 yulduz)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  // Izoh
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  // Buyurtmaga bog'langan bo'lishi mumkin (ixtiyoriy)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  // Tasdiqlangan (faqat admin ko'rsatadi)
  isApproved: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Ko'rsatiladimi
  isVisible: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// ✅ Eng yangi fikrlar tepada
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isApproved: 1, isVisible: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;