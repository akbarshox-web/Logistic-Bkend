import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  licenseNumber: { type: String, default: '' },
  vehicleType: { type: String, default: 'Yuk mashinasi' },
  vehicleNumber: {
    type: String,
    default: '',
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Faol', 'Band', 'Nofaol'],
    default: 'Faol',
    index: true,
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true,
  },
  role: { type: String, default: 'driver' },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

driverSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Mongoose v9 hook formati — callback siz async function
driverSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;