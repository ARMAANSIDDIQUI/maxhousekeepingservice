import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
  target: { type: String, enum: ['service', 'category', 'cart', 'city'], default: 'cart' },
  discountValue: { type: Number, required: true },
  minCartValue: { type: Number, default: 0 },
  validFrom: { type: Date },
  validTo: { type: Date },
  priority: { type: Number, default: 0 },
  stackable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

export const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
export default PricingRule;
