import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import City from '../models/City.js';
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
 * Helper to verify if the given user is strictly the assigned supervisor for a booking
 */
export function isAssignedSupervisor(booking, userId) {
  if (!booking || !userId) return false;
  const uid = userId.toString();
  const supId = booking.supervisor ? (booking.supervisor._id || booking.supervisor).toString() : null;
  const assignedId = booking.assignedSupervisor?.id ? (booking.assignedSupervisor.id._id || booking.assignedSupervisor.id).toString() : null;
  return supId === uid || assignedId === uid;
}

/**
 * Get Supervisor Stats
 * GET /api/v1/supervisor/stats
 */
export async function getSupervisorStats(req, res, next) {
  try {
    const andConditions = [];

    if (req.user.role === 'supervisor') {
      andConditions.push({
        $or: [
          { supervisor: req.user._id },
          { 'assignedSupervisor.id': req.user._id }
        ]
      });
    } else if (req.user.role === 'admin') {
      if (req.query.supervisorId && req.query.supervisorId !== 'all' && req.query.supervisorId !== 'me') {
        andConditions.push({
          $or: [
            { supervisor: req.query.supervisorId },
            { 'assignedSupervisor.id': req.query.supervisorId }
          ]
        });
      } else if (req.query.supervisorId === 'all') {
        // Fleet overview: only count bookings that have an assigned supervisor
        andConditions.push({
          supervisor: { $ne: null, $exists: true }
        });
      } else {
        // By default, show stats for admin's own assigned visits
        andConditions.push({
          $or: [
            { supervisor: req.user._id },
            { 'assignedSupervisor.id': req.user._id }
          ]
        });
      }
    }

    const baseFilter = andConditions.length > 0 ? { $and: [...andConditions] } : {};
    const todayStr = getTodayString();

    const totalAssigned = await Booking.countDocuments(baseFilter);

    const todayFilter = andConditions.length > 0
      ? {
          $and: [
            ...andConditions,
            {
              $or: [
                { 'assignedSlot.date': new RegExp('^' + todayStr) },
                { 'slot.date': new RegExp('^' + todayStr) }
              ]
            }
          ]
        }
      : {
          $or: [
            { 'assignedSlot.date': new RegExp('^' + todayStr) },
            { 'slot.date': new RegExp('^' + todayStr) }
          ]
        };

    const todayBookings = await Booking.countDocuments(todayFilter);

    const inProgress = await Booking.countDocuments({
      ...baseFilter,
      status: 'in_progress'
    });

    const completed = await Booking.countDocuments({
      ...baseFilter,
      status: 'completed'
    });

    const pendingOtp = await Booking.countDocuments({
      ...baseFilter,
      otpVerified: false,
      status: { $in: ['confirmed', 'assigned', 'in_progress', 'pending'] }
    });

    const openPoolCount = await Booking.countDocuments({
      $or: [{ supervisor: null }, { supervisor: { $exists: false } }],
      status: { $nin: ['completed', 'cancelled'] }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        todayBookings,
        inProgress,
        completed,
        pendingOtp,
        openPoolCount
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
    const targetDate = req.query.date || getTodayString();
    const datePrefix = String(targetDate).slice(0, 10);

    const andConditions = [
      {
        $or: [
          { 'assignedSlot.date': new RegExp('^' + datePrefix) },
          { 'slot.date': new RegExp('^' + datePrefix) }
        ]
      }
    ];

    if (req.user.role === 'supervisor') {
      andConditions.push({
        $or: [
          { supervisor: req.user._id },
          { 'assignedSupervisor.id': req.user._id }
        ]
      });
    } else if (req.user.role === 'admin') {
      if (req.query.supervisorId && req.query.supervisorId !== 'all' && req.query.supervisorId !== 'me') {
        andConditions.push({
          $or: [
            { supervisor: req.query.supervisorId },
            { 'assignedSupervisor.id': req.query.supervisorId }
          ]
        });
      } else if (req.query.supervisorId === 'all') {
        andConditions.push({
          supervisor: { $ne: null, $exists: true }
        });
      } else {
        // Default to admin's own assigned jobs
        andConditions.push({
          $or: [
            { supervisor: req.user._id },
            { 'assignedSupervisor.id': req.user._id }
          ]
        });
      }
    }

    const scheduleFilter = { $and: andConditions };

    const STANDARD_SLOTS = [
      '08:00 AM - 10:00 AM',
      '10:00 AM - 12:00 PM',
      '12:00 PM - 02:00 PM',
      '02:00 PM - 04:00 PM',
      '04:00 PM - 06:00 PM',
      '06:00 PM - 08:00 PM'
    ];

    const bookings = await Booking.find(scheduleFilter)
      .select('bookingCode serviceTitle customer address status slot assignedSlot serviceOtp otpVerified photos messages totals supervisor assignedSupervisor')
      .populate('supervisor', 'name phone email avatar')
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
    const { filter, search, page = 1, limit = 50, supervisorId } = req.query;
    const andConditions = [];

    if (filter === 'pool') {
      // Unassigned bookings pool - available to any supervisor
      andConditions.push({
        $or: [{ supervisor: null }, { supervisor: { $exists: false } }],
        status: { $nin: ['completed', 'cancelled'] }
      });
    } else {
      if (req.user.role === 'supervisor') {
        andConditions.push({
          $or: [
            { supervisor: req.user._id },
            { 'assignedSupervisor.id': req.user._id }
          ]
        });
      } else if (req.user.role === 'admin') {
        if (supervisorId && supervisorId !== 'all' && supervisorId !== 'me') {
          andConditions.push({
            $or: [
              { supervisor: supervisorId },
              { 'assignedSupervisor.id': supervisorId }
            ]
          });
        } else if (supervisorId === 'all') {
          // Explicit fleet overview: only show bookings that are actually assigned to a supervisor
          andConditions.push({
            supervisor: { $ne: null, $exists: true }
          });
        } else {
          // Default: bookings assigned to current user
          andConditions.push({
            $or: [
              { supervisor: req.user._id },
              { 'assignedSupervisor.id': req.user._id }
            ]
          });
        }
      }
    }

    const todayStr = getTodayString();

    if (filter === 'today') {
      andConditions.push({
        $or: [
          { 'assignedSlot.date': new RegExp('^' + todayStr) },
          { 'slot.date': new RegExp('^' + todayStr) }
        ]
      });
    } else if (filter === 'pending_otp') {
      andConditions.push({
        otpVerified: false,
        status: { $in: ['confirmed', 'assigned', 'in_progress', 'pending'] }
      });
    } else if (filter === 'in_progress') {
      andConditions.push({ status: 'in_progress' });
    } else if (filter === 'completed') {
      andConditions.push({ status: 'completed' });
    } else if (filter && filter !== 'all' && filter !== 'pool') {
      andConditions.push({ status: filter });
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      andConditions.push({
        $or: [
          { bookingCode: regex },
          { 'customer.name': regex },
          { 'customer.phone': regex },
          { cityName: regex },
          { 'address.line1': regex }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('supervisor', 'name phone email avatar status')
      .sort({ 'assignedSlot.date': 1, 'slot.date': 1, createdAt: -1 })
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

    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingCode: id });
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!isAssignedSupervisor(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the assigned supervisor can verify the customer visit OTP.'
      });
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

    // Automatically transition to in_progress upon OTP verification
    booking.status = 'in_progress';

    booking.statusHistory.push({
      status: 'in_progress',
      timestamp: new Date(),
      note: `Customer service verification OTP successfully verified on visit by supervisor ${req.user.name}. Service status transitioned to In-Progress.`,
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

    if (!isAssignedSupervisor(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the assigned supervisor can upload inspection photos.'
      });
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

    if (!isAssignedSupervisor(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the assigned supervisor can delete inspection photos.'
      });
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

    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingCode: id });
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!isAssignedSupervisor(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the assigned supervisor can update this booking status.'
      });
    }

    if (status && !['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Supervisors can update status to "in_progress" or "completed".'
      });
    }

    if (status === 'completed' && !booking.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark work as completed: Customer arrival OTP must be verified first.'
      });
    }

    if (status) {
      booking.status = status;
      // Immediately terminate live location sharing as soon as service is completed or cancelled
      if (['completed', 'cancelled'].includes(status)) {
        if (!booking.supervisorLiveLocation) {
          booking.supervisorLiveLocation = {};
        }
        booking.supervisorLiveLocation.isSharing = false;
        booking.supervisorLiveLocation.updatedAt = new Date();
      }
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

    if (!isAssignedSupervisor(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the assigned supervisor can send messages for this booking.'
      });
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

/**
 * Get Active Supervisors List (for Fleet Switcher)
 * GET /api/v1/supervisor/supervisors
 */
export async function getSupervisorsList(req, res, next) {
  try {
    const supervisors = await User.find({ role: 'supervisor' })
      .select('name email phone status city avatar')
      .lean();
    res.status(200).json({ success: true, supervisors });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Open Unassigned Bookings Pool
 * GET /api/v1/supervisor/pool
 */
export async function getUnassignedPool(req, res, next) {
  try {
    const pool = await Booking.find({
      $or: [{ supervisor: null }, { supervisor: { $exists: false } }],
      status: { $nin: ['completed', 'cancelled'] }
    })
      .select('bookingCode serviceTitle customer address status slot totals cityName createdAt items')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({ success: true, count: pool.length, bookings: pool });
  } catch (err) {
    next(err);
  }
}

/**
 * Claim an Unassigned Booking
 * POST /api/v1/supervisor/bookings/:id/claim
 */
export async function claimSupervisorBooking(req, res, next) {
  try {
    const { id } = req.params;
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingCode: id });
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const todayStr = getTodayString();
    booking.supervisor = req.user._id;
    booking.assignedSupervisor = {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone || '',
      email: req.user.email || '',
      avatar: req.user.avatar || req.user.avatarUrl || '',
      assignedAt: new Date()
    };
    // Automatically transition to confirmed when supervisor is assigned/claims
    booking.status = 'confirmed';
    booking.assignedSlot = {
      date: booking.slot?.date || todayStr,
      timeWindow: booking.slot?.window || '10:00 AM - 12:00 PM',
      notes: `Claimed from open dispatch pool by supervisor ${req.user.name}.`
    };

    if (!booking.serviceOtp) {
      const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
      booking.serviceOtp = generatedOtp;
    }

    booking.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Self-claimed by supervisor ${req.user.name} from operational dispatch queue. Status confirmed.`,
      updatedBy: req.user._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking #${booking.bookingCode} claimed and confirmed! Added to your active schedule.`,
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a Quick Test / Simulated Booking for Rapid Field Demonstration
 * POST /api/v1/supervisor/quick-test-booking
 */
export async function createQuickTestBooking(req, res, next) {
  try {
    const todayStr = getTodayString();
    const currentHour = new Date().getHours();
    let currentSlot = '10:00 AM - 12:00 PM';
    if (currentHour < 10) currentSlot = '08:00 AM - 10:00 AM';
    else if (currentHour < 12) currentSlot = '10:00 AM - 12:00 PM';
    else if (currentHour < 14) currentSlot = '12:00 PM - 02:00 PM';
    else if (currentHour < 16) currentSlot = '02:00 PM - 04:00 PM';
    else if (currentHour < 18) currentSlot = '04:00 PM - 06:00 PM';
    else currentSlot = '06:00 PM - 08:00 PM';

    let city = await City.findOne({ slug: 'moradabad' });
    if (!city) {
      city = await City.findOne() || await City.create({
        name: 'Moradabad',
        slug: 'moradabad',
        state: 'Uttar Pradesh',
        status: 'active'
      });
    }

    let service = await Service.findOne();
    if (!service) {
      service = await Service.create({
        title: 'Full Home Deep Cleaning & Sanitisation',
        slug: 'full-home-deep-cleaning',
        price: 2499,
        mrp: 3499,
        duration: '2.5 hrs'
      });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const testCode = `MH-${new Date().getFullYear()}-${randomSuffix}`;
    const testOtp = '4921';

    const testBooking = new Booking({
      bookingCode: testCode,
      serviceTitle: service.title || 'Full Home Deep Cleaning & Sanitisation',
      categoryName: 'Home Deep Cleaning',
      customer: {
        name: 'Vikram Malhotra (VIP Homeowner)',
        email: 'vikram.test@maxhousekeeping.in',
        phone: '+91 98977 66002'
      },
      city: city._id,
      cityName: city.name || 'Moradabad',
      address: {
        line1: 'B-14 Civil Lines, Near Asian Vivekanand Hospital',
        cityText: city.name || 'Moradabad',
        stateText: 'Uttar Pradesh',
        pincode: '244001',
        isTemporary: false
      },
      slot: {
        date: todayStr,
        window: currentSlot
      },
      assignedSlot: {
        date: todayStr,
        timeWindow: currentSlot,
        notes: 'Priority field inspection with industrial vacuum & single-disc scrubber.'
      },
      supervisor: req.user._id,
      serviceOtp: testOtp,
      otpVerified: false,
      status: 'assigned',
      items: [
        {
          service: service._id,
          titleSnapshot: service.title || 'Full Home Deep Cleaning',
          variantSnapshot: '2 BHK Villa',
          priceSnapshot: 2499,
          mrpSnapshot: 3499,
          qty: 1
        }
      ],
      totals: {
        subtotal: 2499,
        mrpTotal: 3499,
        discount: 1000,
        couponDiscount: 0,
        total: 2499,
        customerSaved: 1000
      },
      statusHistory: [
        {
          status: 'assigned',
          timestamp: new Date(),
          note: `Quick dispatch test appointment generated for supervisor ${req.user.name}. Customer PIN is 4921.`,
          updatedBy: req.user._id
        }
      ]
    });

    await testBooking.save();

    res.status(201).json({
      success: true,
      message: `Test appointment #${testCode} created for slot ${currentSlot}! Use OTP 4921 to verify on visit.`,
      booking: testBooking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Supervisor Live GPS Location for a Booking
 * POST /api/v1/supervisor/bookings/:id/location
 */
export async function updateSupervisorLiveLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { lat, lng, heading = 0, speed = 0, accuracy = 0, isSharing = true } = req.body;

    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingCode: id });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!isAssignedSupervisor(booking, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the assigned supervisor can broadcast live location for this booking.'
      });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Live location cannot be broadcast for completed or cancelled bookings.'
      });
    }

    if (isSharing && (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.'
      });
    }

    booking.supervisorLiveLocation = {
      lat: isSharing ? lat : (booking.supervisorLiveLocation?.lat || 0),
      lng: isSharing ? lng : (booking.supervisorLiveLocation?.lng || 0),
      heading: Number(heading) || 0,
      speed: Number(speed) || 0,
      accuracy: Number(accuracy) || 0,
      updatedAt: new Date(),
      isSharing: true
    };

    await booking.save();

    // Persist to Supervisor User model
    if (isSharing && typeof lat === 'number' && typeof lng === 'number') {
      const locData = {
        lat,
        lng,
        heading: Number(heading) || 0,
        speed: Number(speed) || 0,
        accuracy: Number(accuracy) || 0,
        updatedAt: new Date(),
        isSharing: true
      };

      await User.findByIdAndUpdate(req.user._id, {
        lastKnownLocation: locData
      }).catch(() => {});

      // Persist across all active bookings for this supervisor
      await Booking.updateMany(
        {
          $or: [{ supervisor: req.user._id }, { 'assignedSupervisor.id': req.user._id }],
          status: { $nin: ['completed', 'cancelled'] },
          _id: { $ne: booking._id }
        },
        {
          $set: {
            supervisorLiveLocation: locData
          }
        }
      ).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Live location updated and persisted successfully.',
      liveLocation: booking.supervisorLiveLocation
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Broadcast Supervisor Live Location across all active bookings indefinitely
 * POST /api/v1/supervisor/location/broadcast
 */
export async function broadcastSupervisorLiveLocation(req, res, next) {
  try {
    const { lat, lng, heading = 0, speed = 0, accuracy = 0 } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.'
      });
    }

    const locData = {
      lat,
      lng,
      heading: Number(heading) || 0,
      speed: Number(speed) || 0,
      accuracy: Number(accuracy) || 0,
      updatedAt: new Date(),
      isSharing: true
    };

    // 1. Update supervisor user lastKnownLocation
    await User.findByIdAndUpdate(req.user._id, {
      lastKnownLocation: locData
    }).catch(() => {});

    // 2. Persist to all active bookings assigned to this supervisor
    const result = await Booking.updateMany(
      {
        $or: [{ supervisor: req.user._id }, { 'assignedSupervisor.id': req.user._id }],
        status: { $nin: ['completed', 'cancelled'] }
      },
      {
        $set: {
          supervisorLiveLocation: locData
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Supervisor location broadcasted and persisted indefinitely across all active visits.',
      updatedBookingsCount: result.modifiedCount || 0,
      liveLocation: locData
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
  updateSupervisorLiveLocation,
  broadcastSupervisorLiveLocation,
  addSupervisorBookingMessage,
  getSupervisorSchedule,
  getSupervisorsList,
  getUnassignedPool,
  claimSupervisorBooking,
  createQuickTestBooking
};

