import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  // Savol
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  // Javob
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  // Kategoriya (ixtiyoriy)
  category: {
    type: String,
    enum: ['umumiy', 'xizmatlar', 'narxlar', 'yetkazish', 'hisob', 'boshqa'],
    default: 'umumiy',
    index: true,
  },
  // Tartiblash (kichik son tepada)
  order: {
    type: Number,
    default: 0,
  },
  // Faol
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// ✅ Tartiblangan ko'rinish
faqSchema.index({ order: 1, createdAt: -1 });

const Faq = mongoose.model('Faq', faqSchema);
export default Faq;