import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String },
  iconKey: { type: String },
  priceDelta: { type: Number, default: 0 },
  mrpDelta: { type: Number, default: 0 },
  multiplier: { type: Number, default: 1 },
  durationDelta: { type: String },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const optionGroupSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['single', 'multi', 'stepper', 'toggle'], default: 'single' },
  required: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  options: [optionSchema]
}, { _id: false });

const matrixRowSchema = new mongoose.Schema({
  selection: { type: Map, of: String, required: true }, // e.g. { size: "2-bhk" }
  price: { type: Number, required: true },              // Offered price (discounted)
  mrp: { type: Number, required: true },                // Shown price (regular)
  duration: { type: String },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  aliases: [{ type: String, index: true }], // Legacy URLs to redirect from
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  categorySlug: { type: String, index: true },
  categoryName: { type: String },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
  categorySlugs: [{ type: String, index: true }],
  categoryNames: [{ type: String }],
  shortDescription: { type: String, trim: true },
  description: { type: String, required: true, trim: true },
  duration: { type: String, default: '1 hr' },
  icon: { type: String, default: 'Sparkles', trim: true },

  // Dual Pricing Controls (Shown Price vs Offered Price)
  pricingMode: { type: String, enum: ['fixed', 'tiered', 'combination'], default: 'combination' },
  price: { type: Number, required: true }, // Offered price (discounted)
  mrp: { type: Number, required: true },   // Shown price (crossed out)
  discountPct: { type: Number, default: 0 },

  optionGroups: [optionGroupSchema],
  matrix: [matrixRowSchema],

  cityOverrides: [{
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    citySlug: { type: String },
    priceOverride: { type: Number },
    mrpOverride: { type: Number },
    multiplier: { type: Number, default: 1.0 },
    isActive: { type: Boolean, default: true }
  }],

  inclusions: [String],
  exclusions: [String],
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  media: {
    hero: { publicId: String, url: String, alt: String },
    gallery: [{ publicId: String, url: String, alt: String }]
  },
  sampleBeforeAfter: {
    beforeUrl: String,
    afterUrl: String,
    isSample: { type: Boolean, default: true }
  },
  cityAvailability: [{ type: String, index: true }], // Array of city slugs
  isPopular: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compute discountPct hook
serviceSchema.pre('save', function (next) {
  if (this.mrp && this.price && this.mrp > this.price) {
    this.discountPct = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  } else {
    this.discountPct = 0;
  }
  next();
});

export const Service = mongoose.model('Service', serviceSchema);
export default Service;
