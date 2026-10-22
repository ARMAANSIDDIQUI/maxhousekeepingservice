import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  state: { type: String, default: 'Uttar Pradesh', trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  serviceRadiusKm: { type: Number, default: 25 },
  pincodes: [{ type: String, trim: true, index: true }],
  status: { type: String, enum: ['active', 'coming_soon', 'inactive'], default: 'active', index: true },
  sortOrder: { type: Number, default: 0 },
  rankingScore: { type: Number, default: 100, index: true }, // Priority score for city scaling & display order
  rankingTier: {
    type: String,
    enum: ['primary', 'tier_1', 'tier_2', 'upcoming'],
    default: 'primary',
    index: true
  },
  tags: [{ type: String, trim: true, index: true }], // Local SEO & scaling keywords
  contactOverrides: {
    phone: String,
    whatsapp: String
  },
  slotWindowsOverride: [String],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

citySchema.index({ location: '2dsphere' });

export const City = mongoose.model('City', citySchema);
export default City;
