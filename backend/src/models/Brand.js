import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logoUrl: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

export const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
