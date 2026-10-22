import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home', trim: true },
  line1: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, default: 'Uttar Pradesh', trim: true },
  pincode: { type: String, required: true, trim: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, sparse: true, index: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['customer', 'cleaner', 'admin'], default: 'customer', index: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatarUrl: { type: String, default: '' },
  emailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  otpSecret: {
    code: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 }
  },
  addresses: [addressSchema],
}, {
  timestamps: true
});

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && this.passwordHash && !this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

// Method to verify password securely
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// Default avatar generator (head+shoulder person avatar) for email users
userSchema.statics.generateDefaultAvatar = function (seed = 'user') {
  // Uses a clean, stylish head+shoulder avatar SVG data URL
  const initials = encodeURIComponent((seed || 'MH').slice(0, 2).toUpperCase());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=10231D&textColor=F4EFE6&radius=50`;
};

// Ensure unique phone only for non-empty string values
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string', $gt: '' } } }
);

export const User = mongoose.model('User', userSchema);
export default User;
