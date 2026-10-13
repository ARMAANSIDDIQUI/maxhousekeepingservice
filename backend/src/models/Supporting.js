import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  subject: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread', index: true }
}, {
  timestamps: true
});

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

const waitlistRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  cityText: { type: String, required: true, trim: true },
  serviceInterest: { type: String, trim: true }
}, {
  timestamps: true
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
