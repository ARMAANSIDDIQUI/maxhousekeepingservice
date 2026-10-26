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

  // Pricing Type (Normal / Tiered vs. Dynamic Per Sq Ft / Unit Calculation)
  pricingType: { type: String, enum: ['normal', 'unit'], default: 'normal' },
  pricingUnit: {
    type: String,
    enum: ['fixed', 'sq_ft', 'litre', 'seat', 'chair', 'fan', 'unit'],
    default: 'fixed'
  },
  unitRateMoradabad: { type: Number },
  unitRateOther: { type: Number },
  unitLabel: { type: String, default: 'Sq. Ft.' },
  minUnitQuantity: { type: Number, default: 1 },
  hasCitySpecificRates: { type: Boolean, default: false },
  cityRates: [{
    citySlug: { type: String },
    cityName: { type: String },
    rate: { type: Number }
  }],
  cityExtraCharge: { type: Number, default: 0 },
  moradabadOnly: { type: Boolean, default: false },
  videoUrl: { type: String, trim: true },
  videoPublicId: { type: String, trim: true },
  videoDuration: { type: Number },

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
  images: [{ publicId: String, url: String, alt: String }],
  sampleBeforeAfter: {
    beforeUrl: String,
    afterUrl: String,
    isSample: { type: Boolean, default: true }
  },
  cityAvailability: [{ type: String, index: true }], // Array of city slugs
  tags: [{ type: String, trim: true, index: true }], // Scaling tags, SEO keywords & search tokens
  rankingScore: { type: Number, default: 100, index: true }, // Priority score (e.g. 100-1000) for catalog order & search ranking
  rankingTier: {
    type: String,
    enum: ['top_rated', 'trending', 'bestseller', 'standard', 'budget'],
    default: 'standard',
    index: true
  },
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

// Compute discountPct & sync media/images hook
serviceSchema.pre('save', function (next) {
  if (this.mrp && this.price && this.mrp > this.price) {
    this.discountPct = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  } else {
    this.discountPct = 0;
  }

  // Ensure media and images fields stay in sync
  if (Array.isArray(this.images) && this.images.length > 0) {
    if (!this.media) this.media = {};
    if (!this.media.hero || !this.media.hero.url) {
      this.media.hero = this.images[0];
    }
    if (!this.media.gallery || this.media.gallery.length === 0) {
      this.media.gallery = this.images.slice(1);
    }
  } else if (this.media?.hero?.url) {
    this.images = [this.media.hero, ...(this.media.gallery || [])];
  }

  next();
});

export const Service = mongoose.model('Service', serviceSchema);
export default Service;
