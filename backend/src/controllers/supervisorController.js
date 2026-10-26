import Booking from '../models/Booking.js';
import User from '../models/User.js';
import cloudinary, { deleteCloudinaryAsset } from '../config/cloudinary.js';

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get Supervisor Stats
 * GET /api/v1/supervisor/stats
 */
export async function getSupervisorStats(req, res, next) {
  try {
    const supervisorId = req.user.role === 'admin' && req.query.supervisorId
      ? req.query.supervisorId
      : req.user._id;

    const todayStr = getTodayString();

    const totalAssigned = await Booking.countDocuments({ supervisor: supervisorId });
    const todayBookings = await Booking.countDocuments({
      supervisor: supervisorId,
      $or: [
        { 'assignedSlot.date': todayStr },
        { 'slot.date': todayStr }
      ]
    });
    const inProgress = await Booking.countDocuments({
      supervisor: supervisorId,
      status: 'in_progress'
    });
    const completed = await Booking.countDocuments({
      supervisor: supervisorId,
      status: 'completed'
    });
    const pendingOtp = await Booking.countDocuments({
      supervisor: supervisorId,
      otpVerified: false,
      status: { $in: ['confirmed', 'assigned', 'in_progress'] }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        todayBookings,
        inProgress,
        completed,
        pendingOtp
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Supervisor Daily Schedule & Slot Itinerary
 * GET /api/v1/supervisor/schedule?date=YYYY-MM-DD
 */
export async function getSupervisorSchedule(req, res, next) {
  try {
    const supervisorId = req.user.role === 'admin' && req.query.supervisorId
      ? req.query.supervisorId
      : req.user._id;

    const targetDate = req.query.date || getTodayString();

    const STANDARD_SLOTS = [
      '08:00 AM - 10:00 AM',
      '10:00 AM - 12:00 PM',
      '12:00 PM - 02:00 PM',
      '02:00 PM - 04:00 PM',
      '04:00 PM - 06:00 PM',
      '06:00 PM - 08:00 PM'
    ];

    const bookings = await Booking.find({
      supervisor: supervisorId,
      $or: [
        { 'assignedSlot.date': targetDate },
        { 'slot.date': targetDate }
      ]
    })
      .select('bookingCode serviceTitle customer address status slot assignedSlot serviceOtp otpVerified photos messages totalAmount')
      .sort({ createdAt: 1 })
      .lean();

    const slotMap = {};
    STANDARD_SLOTS.forEach(slot => {
      slotMap[slot] = [];
    });
    const customSlots = [];

    bookings.forEach(b => {
      const windowStr = b.assignedSlot?.timeWindow || b.slot?.window || 'Unspecified';
      const matched = STANDARD_SLOTS.find(s => s.toLowerCase() === windowStr.trim().toLowerCase());
      if (matched) {
        slotMap[matched].push(b);
      } else {
        customSlots.push({ window: windowStr, booking: b });
      }
    });

    const schedule = STANDARD_SLOTS.map(slotName => ({
      timeWindow: slotName,
      isBooked: slotMap[slotName].length > 0,
      bookingsCount: slotMap[slotName].length,
      bookings: slotMap[slotName]
    }));

    res.status(200).json({
      success: true,
      date: targetDate,
      totalJobs: bookings.length,
      completedJobs: bookings.filter(b => b.status === 'completed').length,
      inProgressJobs: bookings.filter(b => b.status === 'in_progress').length,
      pendingOtpJobs: bookings.filter(b => !b.otpVerified && b.status !== 'completed' && b.status !== 'cancelled').length,
      schedule,
      customSlots
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Assigned Bookings for Supervisor
 * GET /api/v1/supervisor/bookings
 */
export async function getSupervisorBookings(req, res, next) {
  try {
    const supervisorId = req.user.role === 'admin' && req.query.supervisorId
      ? req.query.supervisorId
      : req.user._id;

    const { filter, search, page = 1, limit = 50 } = req.query;
    const query = { supervisor: supervisorId };
    const todayStr = getTodayString();

    if (filter === 'today') {
      query.$or = [
        { 'assignedSlot.date': todayStr },
        { 'slot.date': todayStr }
      ];
    } else if (filter === 'pending_otp') {
      query.otpVerified = false;
      query.status = { $in: ['confirmed', 'assigned', 'in_progress'] };
    } else if (filter === 'in_progress') {
      query.status = 'in_progress';
    } else if (filter === 'completed') {
      query.status = 'completed';
    } else if (filter && filter !== 'all') {
      query.status = filter;
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { bookingCode: regex },
        { 'customer.name': regex },
        { 'customer.phone': regex },
        { cityName: regex },
        { 'address.line1': regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ 'slot.date': 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      bookings
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Specific Booking Details for Supervisor
 * GET /api/v1/supervisor/bookings/:id
 */
export async function getSupervisorBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('city', 'name contactOverrides');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Ensure requester is either assigned supervisor or administrator
    if (req.user.role !== 'admin' && (!booking.supervisor || booking.supervisor.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: You are not assigned to this booking.'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify Customer OTP on Visit
 * POST /api/v1/supervisor/bookings/:id/verify-otp
 */
export async function verifyBookingOtp(req, res, next) {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the verification OTP provided by the customer.'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && (!booking.supervisor || booking.supervisor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    const enteredOtp = otp.trim();
    const correctOtp = String(booking.serviceOtp || '').trim();

    if (!correctOtp) {
      return res.status(400).json({
        success: false,
        message: 'No service OTP was generated for this booking. Please contact support or admin.'
      });
    }

    if (enteredOtp !== correctOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code shown on the customer’s phone or confirmation.'
      });
    }

    booking.otpVerified = true;
    booking.otpVerifiedAt = new Date();

    // Automatically transition to in_progress if still pending/confirmed/assigned
    if (['pending', 'confirmed', 'assigned'].includes(booking.status)) {
      booking.status = 'in_progress';
    }

    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: `Customer service verification OTP successfully verified on visit by supervisor ${req.user.name}.`,
      updatedBy: req.user._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! Service has been verified and started.',
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload Before / After Service Photos
 * POST /api/v1/supervisor/bookings/:id/photos
 */
export async function uploadBookingPhoto(req, res, next) {
  try {
    const { id } = req.params;
    const { type = 'before', notes = '' } = req.body;

    if (!['before', 'after'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo type specified. Must be "before" or "after".'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload.'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && (!booking.supervisor || booking.supervisor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    let photoUrl = '';
    let publicId = '';

    const hasCloudinaryKeys = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinaryKeys) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `max-housekeeping/bookings/${booking.bookingCode}/${type}`,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const result = await uploadPromise;
      photoUrl = result.secure_url;
      publicId = result.public_id;
    } else {
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      publicId = `local_photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    const newPhoto = {
      url: photoUrl,
      publicId,
      notes: notes.trim(),
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    };

    if (!booking.photos) {
      booking.photos = { before: [], after: [] };
    }
    if (!Array.isArray(booking.photos[type])) {
      booking.photos[type] = [];
    }

    booking.photos[type].push(newPhoto);

    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: `Supervisor ${req.user.name} uploaded ${type.toUpperCase()} service photo`,
      updatedBy: req.user._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} photo uploaded successfully!`,
      photo: newPhoto,
      photos: booking.photos
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Service Photo
 * DELETE /api/v1/supervisor/bookings/:id/photos/:photoId
 */
export async function deleteBookingPhoto(req, res, next) {
  try {
    const { id, photoId } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && (!booking.supervisor || booking.supervisor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    let foundPublicId = null;

    if (booking.photos?.before) {
      const idx = booking.photos.before.findIndex(p => p._id?.toString() === photoId);
      if (idx !== -1) {
        foundPublicId = booking.photos.before[idx].publicId;
        booking.photos.before.splice(idx, 1);
      }
    }

    if (booking.photos?.after) {
      const idx = booking.photos.after.findIndex(p => p._id?.toString() === photoId);
      if (idx !== -1) {
        foundPublicId = booking.photos.after[idx].publicId;
        booking.photos.after.splice(idx, 1);
      }
    }

    await booking.save();

    if (foundPublicId && !foundPublicId.startsWith('local_')) {
      deleteCloudinaryAsset(foundPublicId).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Photo removed successfully.',
      photos: booking.photos
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Booking Status & Notes by Supervisor
 * PUT /api/v1/supervisor/bookings/:id/status
 */
export async function updateSupervisorBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && (!booking.supervisor || booking.supervisor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    if (status && !['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Supervisors can update status to "in_progress" or "completed".'
      });
    }

    if (status) {
      booking.status = status;
    }

    const logNote = note || `Status updated to ${status} by supervisor ${req.user.name}`;
    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: logNote,
      updatedBy: req.user._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${booking.status}.`,
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add Booking Chat Message by Supervisor
 * POST /api/v1/supervisor/bookings/:id/message
 */
export async function addSupervisorBookingMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && (!booking.supervisor || booking.supervisor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    const message = {
      sender: 'supervisor',
      senderName: req.user.name,
      text: text.trim(),
      timestamp: new Date()
    };

    booking.messages.push(message);
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
      messages: booking.messages
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getSupervisorStats,
  getSupervisorBookings,
  getSupervisorBookingById,
  verifyBookingOtp,
  uploadBookingPhoto,
  deleteBookingPhoto,
  updateSupervisorBookingStatus,
  addSupervisorBookingMessage,
  getSupervisorSchedule
};
