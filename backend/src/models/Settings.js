import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  brandName: { type: String, default: 'Max House Keeping Service' },
  businessName: { type: String, default: 'Max House Keeping Service' },
  tagline: { type: String, default: 'A spotless home, without lifting a finger.' },
  heroCopy: { type: String, default: 'Book trained, background-verified cleaning professionals for your home or office.' },
  phone: { type: String, default: '+91 98977 66002' },
  primaryPhone: { type: String, default: '+91 98977 66002' },
  alternatePhone: { type: String, default: '+91 82105 23309' },
  secondaryPhone: { type: String, default: '+91 82105 23309' },
  whatsappNumber: { type: String, default: '+91 98977 66002' },
  email: { type: String, default: 'vikasmax321@gmail.com' },
  supportEmail: { type: String, default: 'vikasmax321@gmail.com' },
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
