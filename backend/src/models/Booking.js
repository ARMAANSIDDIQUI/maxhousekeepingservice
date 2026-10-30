import mongoose from 'mongoose';

const bookingItemSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  titleSnapshot: { type: String, required: true },
  variantSnapshot: { type: String }, // e.g. "1 BHK"
  selections: { type: Map, of: String },
  priceSnapshot: { type: Number, required: true }, // Offered price charged
  mrpSnapshot: { type: Number, required: true },   // Shown price baseline
  qty: { type: Number, default: 1 }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, required: true, unique: true, index: true }, // MH-2026-XXXX
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Optional for guest checkout
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true }
  },
  items: [bookingItemSchema],
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  cityName: { type: String, required: true },
  address: {
    line1: { type: String, required: true, trim: true },
    houseOrFlat: { type: String, trim: true },
    formattedAddress: { type: String, trim: true },
    placeId: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    landmark: { type: String, trim: true },
    cityText: { type: String, required: true, trim: true },
    stateText: { type: String, default: 'Uttar Pradesh' },
    pincode: { type: String, required: true, trim: true },
    isTemporary: { type: Boolean, default: false } // Checkbox feature requested by user
  },
  slot: {
    date: { type: String, required: true }, // YYYY-MM-DD
    window: { type: String, required: true } // "Morning (8:00 AM – 11:00 AM)"
  },
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'confirmed', 'assigned', 'in_progress', 'completed', 'paid', 'unresponsive', 'spam', 'cancelled'],
    default: 'pending',
    index: true
  },
  messages: [{
    sender: { type: String, enum: ['customer', 'admin', 'supervisor'], required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now }
  }],
  totals: {
    subtotal: { type: Number, required: true },
    mrpTotal: { type: Number, required: true },
    outstationSurcharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    gstEnabled: { type: Boolean, default: false },
    gstPercentage: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    platformChargeEnabled: { type: Boolean, default: false },
    platformChargeType: { type: String, default: 'flat' },
    platformChargeValue: { type: Number, default: 0 },
    platformChargeAmount: { type: Number, default: 0 },
    platformChargeLabel: { type: String, default: 'Platform Charges' },
    total: { type: Number, required: true },
    customerSaved: { type: Number, required: true }
  },
  appliedCoupon: {
    code: { type: String },
    discountAmount: { type: Number, default: 0 }
  },
  priceVersion: { type: String, default: 'v1' },
  paymentMode: {
    type: String,
    enum: ['cash_on_service', 'online_before', 'online_after', 'razorpay'],
    default: 'cash_on_service'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
    index: true
  },
  paymentDetails: {
    transactionId: { type: String, trim: true },
    orderId: { type: String, trim: true },
    signature: { type: String },
    provider: { type: String, default: 'razorpay' },
    paidAt: { type: Date },
    amount: { type: Number },
    method: { type: String }, // 'upi' | 'card' | 'netbanking' | 'wallet'
    receipt: { type: String }
  },
  assignedCrew: {
    name: String,
    phone: String
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedSupervisor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    avatar: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    assignedAt: { type: Date }
  },
  assignedSlot: {
    date: { type: String },
    timeWindow: { type: String },
    notes: { type: String }
  },
  supervisorLiveLocation: {
    lat: { type: Number },
    lng: { type: Number },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    updatedAt: { type: Date },
    isSharing: { type: Boolean, default: true }
  },
  serviceOtp: {
    type: String,
    trim: true,
    index: true
  },
  otpVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  otpVerifiedAt: {
    type: Date
  },
  photos: {
    before: [{
      url: { type: String, required: true },
      publicId: { type: String },
      notes: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    after: [{
      url: { type: String, required: true },
      publicId: { type: String },
      notes: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true
});

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
