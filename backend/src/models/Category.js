import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  tagline: { type: String, trim: true },
  iconKey: { type: String, default: 'PiHouseLine' },
  image: {
    publicId: String,
    url: String,
    alt: String
  },
  serviceCount: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

export const Category = mongoose.model('Category', categorySchema);
export default Category;
