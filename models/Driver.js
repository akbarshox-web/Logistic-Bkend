import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  licenseNumber: { type: String, default: '' },
  vehicleType: { type: String, default: 'Yuk mashinasi' },
  status: {
    type: String,
    enum: ['Faol', 'Band', 'Nofaol'],
    default: 'Faol'
  },
  role: { type: String, default: 'driver' },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

driverSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ FIX: Mongoose v9 hook formati
driverSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;