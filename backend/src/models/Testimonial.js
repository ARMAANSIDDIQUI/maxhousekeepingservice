import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, default: 'Homeowner', trim: true },
  city: { type: String, required: true, trim: true },
  serviceTitle: { type: String, default: '', trim: true },
  quote: { type: String, default: '', trim: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  videoUrl: { type: String, default: '', trim: true },
  videoPublicId: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  source: { type: String, default: 'Verified Client', trim: true },
  reviewDateLabel: { type: String, default: '', trim: true },
  reviewCountLabel: { type: String, default: '', trim: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
