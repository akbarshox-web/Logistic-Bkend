import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    required: true,
    trim: true,
  },
  // ✅ FIX: website ixtiyoriy — frontend har doim yubormasligi mumkin
  website: {
    type: String,
    required: false,
    default: '',
    trim: true,
  }
}, {
  timestamps: true
});

const Partner = mongoose.model('Partner', partnerSchema);
export default Partner;