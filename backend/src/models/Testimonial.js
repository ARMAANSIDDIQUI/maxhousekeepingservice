import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, default: 'Homeowner', trim: true },
  city: { type: String, required: true, trim: true },
  quote: { type: String, required: true, trim: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
