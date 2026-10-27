import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: { type: String, default: '', trim: true },
  discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  minBookingAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number }, // For percentage discounts
  usageLimit: { type: Number, default: 1000 },
  usedCount: { type: Number, default: 0 },
  expiryDate: { type: Date },
  validUntil: { type: Date },
  // Smart Rules
  firstBookingOnly: { type: Boolean, default: false }, // 1st booking only for new users
  oncePerUser: { type: Boolean, default: false }, // 1 redemption per customer
  applicableServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }], // specific services
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // specific categories
  showInOffers: { type: Boolean, default: true }, // showcase in available coupons drawer
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

// Pre-save hook to synchronize alias fields
couponSchema.pre('save', function (next) {
  if (this.minOrderValue && !this.minBookingAmount) this.minBookingAmount = this.minOrderValue;
  if (this.minBookingAmount && !this.minOrderValue) this.minOrderValue = this.minBookingAmount;
  if (this.expiryDate && !this.validUntil) this.validUntil = this.expiryDate;
  if (this.validUntil && !this.expiryDate) this.expiryDate = this.validUntil;
  next();
});

export const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
