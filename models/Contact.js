import mongoose from 'mongoose';

/**
 * ✅ Bog'lanish sahifasidan kelgan xabarlar
 */
const contactSchema = new mongoose.Schema({
  // Yuboruvchi ismi
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  // Email
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  // Telefon (ixtiyoriy)
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  // Mavzu
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  // Xabar
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  // Login qilgan user (ixtiyoriy)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Holati
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new',
    index: true,
  },
  // Admin javobi
  adminReply: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  repliedAt: {
    type: Date,
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // IP
  ip: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// ✅ Eng yangi xabarlar tepada
contactSchema.index({ createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;