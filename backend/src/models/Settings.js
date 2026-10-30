import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  brandName: { type: String, default: 'Max Housekeeping Service' },
  businessName: { type: String, default: 'Max Housekeeping Service' },
  tagline: { type: String, default: 'A spotless home, without lifting a finger.' },
  heroCopy: { type: String, default: 'Book trained, background-verified cleaning professionals for your home or office.' },
  phone: { type: String, default: '+91 98977 66002' },
  primaryPhone: { type: String, default: '+91 98977 66002' },
  alternatePhone: { type: String, default: '' },
  secondaryPhone: { type: String, default: '' },
  whatsappNumber: { type: String, default: '+91 98977 66002' },
  email: { type: String, default: 'contactmaxhousekeepingservice@gmail.com' },
  supportEmail: { type: String, default: 'contactmaxhousekeepingservice@gmail.com' },
  instagramUrl: { type: String, default: 'https://www.instagram.com/maxhousekeepingservice/' },
  youtubeUrl: { type: String, default: 'https://youtube.com/@maxhousekeepingservices' },
  address: { type: String, default: 'Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001' },
  workingHours: { type: String, default: '8:00 AM – 8:00 PM (Monday – Sunday)' },
  heroStats: [{
    label: String,
    value: Number,
    suffix: String
  }],
  trustBadges: [String],
  stepByStep: [{
    step: Number,
    title: String,
    description: String
  }],
  gstEnabled: { type: Boolean, default: false },
  gstPercentage: { type: Number, default: 18 },
  gstNumber: { type: String, default: '' },
  platformChargeEnabled: { type: Boolean, default: false },
  platformChargeType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  platformChargeAmount: { type: Number, default: 49 },
  platformChargeLabel: { type: String, default: 'Platform Charges' },
  showAgencyCredit: { type: Boolean, default: false },
  agencyCreditText: { type: String, default: 'Built with Love · By Kwacko Solutions Private Limited' },
  agencyCreditUrl: { type: String, default: '' },
  ratingClaim: { type: String, default: 'Rated 4.9/5 by 10,000+ happy homes' },

  // Payment Gateway Settings (Online Website Payments)
  acceptOnlinePayments: { type: Boolean, default: false }, // Default: false (Cash on Service)
  paymentGatewayProvider: { type: String, default: 'razorpay' },
  razorpayKeyId: { type: String, default: '' },
  razorpayKeySecret: { type: String, default: '', select: false },
  paymentTestMode: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
