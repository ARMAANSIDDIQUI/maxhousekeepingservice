import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true },
  subject: { type: String, trim: true, default: 'General Inquiry' },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread', index: true }
}, {
  timestamps: true
});

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

const waitlistRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, trim: true },
  cityText: { type: String, trim: true },
  pincode: { type: String, trim: true },
  serviceNeeded: { type: String, trim: true },
  serviceInterest: { type: String, trim: true }
}, {
  timestamps: true
});

// Ensure cityText is populated from city if provided
waitlistRequestSchema.pre('save', function (next) {
  if (this.city && !this.cityText) this.cityText = this.city;
  if (this.cityText && !this.city) this.city = this.cityText;
  if (this.serviceNeeded && !this.serviceInterest) this.serviceInterest = this.serviceNeeded;
  if (this.serviceInterest && !this.serviceNeeded) this.serviceNeeded = this.serviceInterest;
  next();
});

export const WaitlistRequest = mongoose.model('WaitlistRequest', waitlistRequestSchema);

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'UPDATE_PRICE', 'CREATE_SERVICE'
  modelName: { type: String, required: true },
  recordId: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performerName: { type: String },
  beforeState: { type: mongoose.Schema.Types.Mixed },
  afterState: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const mediaSchema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
  width: { type: Number },
  height: { type: Number },
  bytes: { type: Number },
  alt: { type: String },
  folder: { type: String, default: 'max-housekeeping/uploads' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

export const Media = mongoose.model('Media', mediaSchema);

export default { ContactMessage, WaitlistRequest, AuditLog, Media };
