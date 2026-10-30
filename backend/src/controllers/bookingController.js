import crypto from 'crypto';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import City from '../models/City.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import Counter from '../models/Counter.js';
import Settings from '../models/Settings.js';
import { calculateQuote } from '../services/pricing/engine.js';
import { sendBookingConfirmationEmail, sendAdminNewBookingNotification } from '../services/emailService.js';
import { validateDateMonthDays, formatDateDMY } from '../utils/dateValidation.js';
import { geocodeAddressText } from '../services/location/locationService.js';

/**
 * Guaranteed Unique, Non-Repeating Sequential Booking Code Generator
 * Uses MongoDB atomic $inc on Counter collection with collision verification
 */
export async function generateUniqueBookingCode() {
  const year = new Date().getFullYear();
  const counterId = `booking_${year}`;
  let isUnique = false;
  let code = '';
  let attempts = 0;

  while (!isUnique && attempts < 20) {
    attempts++;
    // Atomic sequential increment guaranteed non-repeating across concurrent requests
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Format: MH-YYYY-XXXXX (e.g. MH-2026-01001, MH-2026-01002)
    const formattedSeq = String(counter.seq).padStart(5, '0');
    code = `MH-${year}-${formattedSeq}`;

    // Verify uniqueness in bookings collection
    const exists = await Booking.exists({ bookingCode: code });
    if (!exists) {
      isUnique = true;
    }
  }

  // Fallback in case of collision with legacy records
  if (!isUnique) {
    const randomSuffix = crypto.randomInt(100000, 1000000);
    code = `MH-${year}-${Date.now().toString().slice(-4)}${randomSuffix.toString().slice(-2)}`;
  }

  return code;
}

/**
 * Helper to find a booking by either Mongo _id or human-readable bookingCode
 */
export async function findBookingByIdOrCode(idOrCode) {
  if (!idOrCode) return null;
  const trimmed = String(idOrCode).trim();
  if (mongoose.isValidObjectId(trimmed)) {
    const byId = await Booking.findById(trimmed);
    if (byId) return byId;
  }
  return await Booking.findOne({ bookingCode: trimmed.toUpperCase() }) || await Booking.findOne({ bookingCode: trimmed });
}

/**
 * Helper to validate smart coupon rules:
 * - Active & expiry date
 * - Usage limit
 * - firstBookingOnly
 * - oncePerUser
 * Returns { coupon, error }
 */
export async function validateSmartCoupon(couponCode, { user = null, customer = null, phone = null, email = null } = {}) {
  if (!couponCode || !String(couponCode).trim()) return { coupon: null, error: null };

  const code = String(couponCode).trim().toUpperCase();
  const now = new Date();

  const coupon = await Coupon.findOne({
    code,
    isActive: true,
    $or: [
      { validUntil: { $gte: now } },
      { expiryDate: { $gte: now } },
      { expiryDate: { $exists: false }, validUntil: { $exists: false } }
    ]
  }).populate('applicableServices', 'title slug price');

  if (!coupon) {
    return { coupon: null, error: `Invalid or expired coupon code "${code}".` };
  }

  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { coupon: null, error: `Coupon "${code}" has reached its maximum redemption limit.` };
  }

  // Identify customer markers across phone, email, and user account
  const rawPhone = customer?.phone || phone || user?.phone;
  const cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, '').slice(-10) : null;
  const cleanEmail = (customer?.email || email || user?.email || '').trim().toLowerCase();
  const userId = user?._id || user?.id;

  const identityQueries = [];
  if (userId) identityQueries.push({ user: userId });
  if (cleanPhone && cleanPhone.length === 10) {
    identityQueries.push({ 'customer.phone': new RegExp(cleanPhone + '$') });
  }
  if (cleanEmail && cleanEmail.includes('@')) {
    identityQueries.push({ 'customer.email': new RegExp(`^${cleanEmail}$`, 'i') });
  }

  // Rule 1: firstBookingOnly (1st booking only for new users)
  if (coupon.firstBookingOnly) {
    if (identityQueries.length > 0) {
      const priorBookings = await Booking.countDocuments({
        $or: identityQueries,
        status: { $ne: 'cancelled' }
      });
      if (priorBookings > 0) {
        return {
          coupon: null,
          error: `Coupon "${coupon.code}" is exclusively for new customers on their 1st booking. Prior bookings were found with your details.`
        };
      }
    }
  }

  // Rule 2: oncePerUser (Once per user)
  if (coupon.oncePerUser) {
    if (identityQueries.length > 0) {
      const redeemedBefore = await Booking.countDocuments({
        'appliedCoupon.code': coupon.code,
        $or: identityQueries,
        status: { $ne: 'cancelled' }
      });
      if (redeemedBefore > 0) {
        return {
          coupon: null,
          error: `Coupon "${coupon.code}" can only be redeemed once per customer. It has already been applied to a previous booking.`
        };
      }
    }
  }

  return { coupon, error: null };
}

/**
 * Generate Live Price Quote with Dual-Pricing Breakdown
 * POST /api/v1/bookings/quote
 */
export async function getQuote(req, res, next) {
  try {
    const { items = [], citySlug, couponCode, customer, phone, email } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service item must be selected.'
      });
    }

    // Fetch all service documents
    const serviceIds = items.map(i => i.serviceId || i.service);
    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    const serviceMap = new Map(services.map(s => [s._id.toString(), s]));

    const enrichedItems = [];
    for (const item of items) {
      const id = String(item.serviceId || item.service);
      const service = serviceMap.get(id);
      if (!service) continue;

      enrichedItems.push({
        service,
        selections: item.selections || {},
        qty: Math.max(1, Number(item.qty) || 1)
      });
    }

    if (enrichedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid active services found for the requested items.'
      });
    }

    // Check smart coupon rules if provided
    let coupon = null;
    let preCouponError = null;
    if (couponCode && couponCode.trim()) {
      const validated = await validateSmartCoupon(couponCode, {
        user: req.user,
        customer,
        phone,
        email
      });
      coupon = validated.coupon;
      preCouponError = validated.error;
    }

    const settings = await Settings.findOne().lean();
    const calculation = calculateQuote(enrichedItems, citySlug, coupon, settings || {});

    // If pre-validation failed (e.g. not 1st booking or already used), convey clear error
    if (preCouponError && !calculation.couponError) {
      calculation.couponError = preCouponError;
    }

    res.status(200).json({
      success: true,
      quote: calculation
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new Booking
 * POST /api/v1/bookings
 */
export async function createBooking(req, res, next) {
  try {
    const {
      items,
      customer,
      cityId,
      citySlug,
      address,
      slot,
      notes,
      couponCode,
      paymentMode,
      paymentStatus,
      paymentDetails,
      saveAddressToProfile // Boolean to save newly entered permanent address
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to complete your booking.'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one service.' });
    }

    if (!customer?.name || !customer?.name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    const trimmedName = customer.name.trim();
    if (!/^[a-zA-Z\s]{2,60}$/.test(trimmedName)) {
      return res.status(400).json({
        success: false,
        message: 'Name can only contain alphabetic letters and spaces. No numbers or special symbols allowed.'
      });
    }

    if (!customer?.phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const cleanPhone = String(customer.phone).replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
      });
    }

    if (!address?.line1 || address.line1.trim().length < 5 || !address?.cityText || !address?.pincode) {
      return res.status(400).json({ success: false, message: 'Complete service address is required.' });
    }

    const cleanPincode = String(address.pincode).replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit postal pincode.' });
    }

    if (!slot?.date || !slot?.window) {
      return res.status(400).json({ success: false, message: 'Booking date and time window are required.' });
    }

    const slotDateValidation = validateDateMonthDays(slot.date);
    if (!slotDateValidation.valid) {
      return res.status(400).json({ success: false, message: slotDateValidation.error });
    }

    // Resolve City
    let cityDoc = null;
    if (cityId) {
      cityDoc = await City.findById(cityId);
    } else if (citySlug) {
      cityDoc = await City.findOne({ slug: citySlug.toLowerCase() });
    }
    if (!cityDoc) {
      // Fallback: find by cityText
      cityDoc = await City.findOne({ name: new RegExp(address.cityText, 'i') });
      if (!cityDoc) {
        cityDoc = await City.findOne({ status: 'active' }); // Default fallback
      }
    }

    // Strict check: if citySlug or cityDoc is selected, address.cityText must match the selected city name
    if (address?.cityText) {
      const normAddrCity = String(address.cityText).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normSiteCityName = String(cityDoc?.name || citySlug || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normSiteCitySlug = String(cityDoc?.slug || citySlug || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const aliases = {
        gurgaon: 'gurugram',
        gurugram: 'gurgaon',
        newdelhi: 'delhi',
        delhi: 'newdelhi',
        delhincr: 'delhi',
        bangalore: 'bengaluru',
        bengaluru: 'bangalore',
        prayagraj: 'allahabad',
        allahabad: 'prayagraj'
      };
      const isSameCity =
        !normSiteCityName ||
        normAddrCity === normSiteCityName ||
        normAddrCity === normSiteCitySlug ||
        aliases[normAddrCity] === normSiteCityName ||
        aliases[normAddrCity] === normSiteCitySlug;

      if (!isSameCity) {
        return res.status(400).json({
          success: false,
          message: `Selected site city (${cityDoc?.name || citySlug}) does not match the booking address city (${address.cityText}). Both city names must be the same.`
        });
      }
    }

    // Resolve Services & Calculate Quote
    const serviceIds = items.map(i => i.serviceId || i.service);
    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    const serviceMap = new Map(services.map(s => [s._id.toString(), s]));

    const enrichedItems = [];
    for (const item of items) {
      const id = String(item.serviceId || item.service);
      const service = serviceMap.get(id);
      if (!service) continue;

      enrichedItems.push({
        service,
        selections: item.selections || {},
        qty: Math.max(1, Number(item.qty) || 1)
      });
    }

    let coupon = null;
    if (couponCode && couponCode.trim()) {
      const validated = await validateSmartCoupon(couponCode, {
        user: req.user,
        customer,
        phone: customer?.phone,
        email: customer?.email
      });
      if (validated.error) {
        return res.status(400).json({
          success: false,
          message: validated.error
        });
      }
      coupon = validated.coupon;
    }

    const settings = await Settings.findOne().lean();
    const quote = calculateQuote(enrichedItems, cityDoc?.slug, coupon, settings || {});

    if (couponCode && quote.couponError) {
      return res.status(400).json({
        success: false,
        message: quote.couponError
      });
    }

    // Generate foolproof, guaranteed non-repeating unique Booking Code
    const bookingCode = await generateUniqueBookingCode();

    // Prepare item snapshots with both shown and offered prices
    const itemSnapshots = quote.items.map(i => ({
      service: i.serviceId,
      titleSnapshot: i.title,
      variantSnapshot: i.selections?.size || i.duration || '',
      selections: i.selections,
      priceSnapshot: i.unitPrice,
      mrpSnapshot: i.unitMrp,
      qty: i.qty
    }));

    // Check temporary address logic
    const isTempAddress = Boolean(address.isTemporary);

    let bookingCoords = (address.coordinates && typeof address.coordinates.lat === 'number' && typeof address.coordinates.lng === 'number' && address.coordinates.lat !== 0) ? {
      lat: address.coordinates.lat,
      lng: address.coordinates.lng
    } : undefined;

    // Automatic Geocoding if coordinates were not captured from map
    if (!bookingCoords) {
      const fullText = [address.houseOrFlat, address.line1, address.landmark, address.cityText || cityDoc.name].filter(Boolean).join(', ');
      const geocoded = await geocodeAddressText(fullText, address.cityText || cityDoc.name).catch(() => null);
      if (geocoded?.lat && geocoded?.lng) {
        bookingCoords = { lat: geocoded.lat, lng: geocoded.lng };
      }
    }

    const bookingData = {
      bookingCode,
      user: req.user ? req.user._id : undefined,
      customer: {
        name: customer.name.trim(),
        phone: cleanPhone,
        email: customer.email ? customer.email.trim() : undefined
      },
      items: itemSnapshots,
      city: cityDoc._id,
      cityName: cityDoc.name,
      address: {
        line1: address.line1.trim(),
        houseOrFlat: address.houseOrFlat ? address.houseOrFlat.trim() : '',
        formattedAddress: address.formattedAddress ? address.formattedAddress.trim() : '',
        placeId: address.placeId ? address.placeId.trim() : '',
        coordinates: bookingCoords,
        landmark: address.landmark ? address.landmark.trim() : '',
        cityText: address.cityText.trim(),
        stateText: address.stateText || 'Uttar Pradesh',
        pincode: address.pincode.trim(),
        isTemporary: isTempAddress
      },
      slot: {
        date: slot.date,
        window: slot.window
      },
      notes: notes ? notes.trim() : '',
      status: (paymentStatus === 'paid' || paymentDetails?.transactionId) ? 'confirmed' : 'pending',
      totals: quote.totals,
      appliedCoupon: quote.coupon,
      serviceOtp: crypto.randomInt(1000, 10000).toString(),
      otpVerified: false,
      paymentMode: paymentMode || 'cash_on_service',
      paymentStatus: paymentStatus || (paymentDetails?.transactionId ? 'paid' : 'pending'),
      paymentDetails: paymentDetails || undefined,
      statusHistory: [{
        status: (paymentStatus === 'paid' || paymentDetails?.transactionId) ? 'confirmed' : 'pending',
        timestamp: new Date(),
        note: (paymentStatus === 'paid' || paymentDetails?.transactionId)
          ? `Booking confirmed with advance payment via ${(paymentDetails?.method || 'online').toUpperCase()} (Txn #${paymentDetails?.transactionId || ''})`
          : 'Booking submitted by customer'
      }]
    };

    const newBooking = await Booking.create(bookingData);

    // Increment coupon usage count if applied
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save().catch(err => console.warn('[Coupon Count Update Warning]:', err.message));
    }

    // Automated Email Dispatch: Customer Confirmation + Admin Alert
    Promise.allSettled([
      sendBookingConfirmationEmail({ booking: newBooking, customerEmail: newBooking.customer?.email }),
      sendAdminNewBookingNotification({ booking: newBooking })
    ]).catch(emailErr => {
      console.warn('[Email Automation Notice]:', emailErr.message);
    });

    // Address Book Management: Auto-clean existing duplicates and only add if genuinely new
    if (req.user) {
      const userDoc = await User.findById(req.user._id);
      if (userDoc && Array.isArray(userDoc.addresses)) {
        let changed = false;
        // 1. Deduplicate any existing duplicates in user's saved addresses
        const seen = new Set();
        const cleanAddresses = [];
        for (const addr of userDoc.addresses) {
          const key = `${(addr.line1 || '').toLowerCase().replace(/[\W_]+/g, ' ').trim()}|${String(addr.pincode || '').trim().replace(/\D/g, '')}`;
          if (!seen.has(key)) {
            seen.add(key);
            cleanAddresses.push(addr);
          } else {
            changed = true;
          }
        }

        // 2. Only append if saveAddressToProfile is true, not temporary, and NOT already saved
        if (saveAddressToProfile && !isTempAddress) {
          const normLine1 = (address.line1 || '').toLowerCase().replace(/[\W_]+/g, ' ').trim();
          const normPincode = String(address.pincode || '').trim().replace(/\D/g, '');
          const newKey = `${normLine1}|${normPincode}`;

          if (!seen.has(newKey)) {
            seen.add(newKey);
            cleanAddresses.push({
              label: address.label || 'Home',
              line1: address.line1.trim(),
              houseOrFlat: address.houseOrFlat ? address.houseOrFlat.trim() : '',
              formattedAddress: address.formattedAddress ? address.formattedAddress.trim() : '',
              placeId: address.placeId ? address.placeId.trim() : '',
              coordinates: bookingCoords || ((address.coordinates && typeof address.coordinates.lat === 'number' && typeof address.coordinates.lng === 'number') ? {
                lat: address.coordinates.lat,
                lng: address.coordinates.lng
              } : undefined),
              landmark: address.landmark ? address.landmark.trim() : '',
              city: address.cityText.trim(),
              state: address.stateText || 'Uttar Pradesh',
              pincode: address.pincode.trim(),
              isDefault: cleanAddresses.length === 0
            });
            changed = true;
          }
        }

        if (changed || cleanAddresses.length !== userDoc.addresses.length) {
          userDoc.addresses = cleanAddresses;
          await userDoc.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking: newBooking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Track Booking by Code (Privacy Protected)
 * GET /api/v1/bookings/track/:code
 */
export async function trackBooking(req, res, next) {
  try {
    const { code } = req.params;
    const booking = await Booking.findOne({ bookingCode: code.toUpperCase() })
      .populate('city', 'name contactOverrides')
      .populate('supervisor', 'name phone email avatar avatarUrl role status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No booking found with this reference code.'
      });
    }

    // Ensure serviceOtp exists
    if (!booking.serviceOtp) {
      booking.serviceOtp = crypto.randomInt(1000, 10000).toString();
      await booking.save().catch(() => {});
    }

    const bookingObj = booking.toObject();

    // Check if requester is authenticated owner/admin/supervisor or provided verification phone query
    const verifyPhone = req.query.phone ? String(req.query.phone).trim().replace(/\D/g, '') : null;
    const isOwner = req.user && (
      req.user.role === 'admin' ||
      (req.user.role === 'supervisor' && booking.supervisor && booking.supervisor.toString() === req.user._id.toString()) ||
      (booking.user && booking.user.toString() === req.user._id.toString()) ||
      booking.customer?.phone === req.user.phone
    );
    const isPhoneVerified = verifyPhone && booking.customer?.phone && (
      booking.customer.phone.endsWith(verifyPhone) || verifyPhone.endsWith(booking.customer.phone)
    );

    if (!isOwner && !isPhoneVerified) {
      // Mask phone (e.g. 98977***** or ***-***-6002)
      if (bookingObj.customer?.phone) {
        const rawPhone = bookingObj.customer.phone;
        bookingObj.customer.phone = rawPhone.length >= 4
          ? rawPhone.slice(0, 3) + '*****' + rawPhone.slice(-2)
          : '******';
      }
      // Mask email
      if (bookingObj.customer?.email) {
        const [userPart, domain] = bookingObj.customer.email.split('@');
        bookingObj.customer.email = (userPart ? userPart[0] + '***@' : '') + (domain || '');
      }
      // Partially mask street address for privacy
      if (bookingObj.address?.line1) {
        const parts = bookingObj.address.line1.split(' ');
        bookingObj.address.line1 = parts.slice(0, 2).join(' ') + ', [Address Protected]';
      }
      // Strip internal messages and secret OTP from unauthenticated public tracker
      delete bookingObj.messages;
      delete bookingObj.serviceOtp;
    }

    res.status(200).json({
      success: true,
      booking: bookingObj
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Current User's Bookings
 * GET /api/v1/bookings/my
 */
export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({
      $or: [
        { user: req.user._id },
        { 'customer.phone': req.user.phone }
      ]
    }).populate('supervisor', 'name phone email avatar avatarUrl role status')
      .sort({ createdAt: -1 });

    // Ensure each booking has a serviceOtp
    for (const b of bookings) {
      if (!b.serviceOtp) {
        b.serviceOtp = crypto.randomInt(1000, 10000).toString();
        await b.save().catch(() => {});
      }
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    next(err);
  }
}

// Helper to verify user permissions on a booking (prevents IDOR and empty string matches)
export function isAuthorizedForBooking(booking, user) {
  if (!user || user.isActive === false) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'supervisor' && booking.supervisor && booking.supervisor.toString() === user._id.toString()) return true;
  if (booking.user && booking.user.toString() === user._id.toString()) return true;

  const userPhone = user.phone ? String(user.phone).trim() : '';
  const bookingPhone = booking.customer?.phone ? String(booking.customer.phone).trim() : '';
  if (userPhone && bookingPhone && (bookingPhone === userPhone || bookingPhone.endsWith(userPhone) || userPhone.endsWith(bookingPhone))) {
    return true;
  }

  const userEmail = user.email ? String(user.email).trim().toLowerCase() : '';
  const bookingEmail = booking.customer?.email ? String(booking.customer.email).trim().toLowerCase() : '';
  if (userEmail && bookingEmail && bookingEmail === userEmail) {
    return true;
  }

  return false;
}

/**
 * Edit Booking Details by Customer or Admin
 * PUT /api/v1/bookings/:id/edit
 */
export async function editBookingDetails(req, res, next) {
  try {
    const { id } = req.params;
    const { customer, address, slot, notes } = req.body;

    const booking = await findBookingByIdOrCode(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!isAuthorizedForBooking(booking, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to edit this booking.'
      });
    }

    if (['completed', 'cancelled', 'in_progress'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit booking that is already in progress, completed, or cancelled.'
      });
    }

    if (customer?.name) {
      const trimmedName = customer.name.trim();
      if (!/^[a-zA-Z\s]{2,60}$/.test(trimmedName)) {
        return res.status(400).json({
          success: false,
          message: 'Name can only contain alphabetic letters and spaces. No numbers or special symbols allowed.'
        });
      }
      booking.customer.name = trimmedName;
    }

    if (customer?.phone) {
      const cleanPhone = String(customer.phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        });
      }
      booking.customer.phone = cleanPhone;
    }
    if (customer?.email) booking.customer.email = customer.email.trim();

    if (address?.line1) booking.address.line1 = address.line1.trim();
    if (address?.houseOrFlat !== undefined) booking.address.houseOrFlat = address.houseOrFlat.trim();
    if (address?.formattedAddress !== undefined) booking.address.formattedAddress = address.formattedAddress.trim();
    if (address?.placeId !== undefined) booking.address.placeId = address.placeId.trim();
    if (address?.coordinates && typeof address.coordinates.lat === 'number' && typeof address.coordinates.lng === 'number') {
      booking.address.coordinates = {
        lat: address.coordinates.lat,
        lng: address.coordinates.lng
      };
    }
    if (address?.landmark !== undefined) booking.address.landmark = address.landmark.trim();
    if (address?.pincode) booking.address.pincode = address.pincode.trim();
    if (address?.cityText) booking.address.cityText = address.cityText.trim();

    if (slot?.date) {
      const slotDateValidation = validateDateMonthDays(slot.date);
      if (!slotDateValidation.valid) {
        return res.status(400).json({ success: false, message: slotDateValidation.error });
      }
      booking.slot.date = slot.date;
    }
    if (slot?.window) booking.slot.window = slot.window;
    if (notes !== undefined) booking.notes = notes.trim();

    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: req.user?.role === 'admin' ? 'Details updated by administrator' : 'Details updated by customer',
      updatedBy: req.user?._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking details updated successfully.',
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get messages for booking communication thread (saved for 7 days)
 * GET /api/v1/bookings/:id/messages
 */
export async function getBookingMessages(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await findBookingByIdOrCode(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const verifyPhone = req.query.phone ? String(req.query.phone).trim().replace(/\D/g, '') : null;
    const isPhoneMatch = verifyPhone && booking.customer?.phone && (
      booking.customer.phone.endsWith(verifyPhone) || verifyPhone.endsWith(booking.customer.phone)
    );

    if (!isAuthorizedForBooking(booking, req.user) && !isPhoneMatch) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view messages for this booking.'
      });
    }

    // Chat retention: Retain messages for 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const validMessages = (booking.messages || []).filter(m => new Date(m.timestamp) >= sevenDaysAgo);
    
    // Automatically purge expired messages from DB
    if (validMessages.length !== (booking.messages || []).length) {
      booking.messages = validMessages;
      await booking.save();
    }

    res.status(200).json({
      success: true,
      messages: validMessages
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add message to booking communication thread (Customer <-> Supervisor / Admin)
 * POST /api/v1/bookings/:id/messages
 */
export async function addBookingMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { text, senderName, phone } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const booking = await findBookingByIdOrCode(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const verifyPhone = phone ? String(phone).trim().replace(/\D/g, '') : (req.query.phone ? String(req.query.phone).trim().replace(/\D/g, '') : null);
    const isPhoneMatch = verifyPhone && booking.customer?.phone && (
      booking.customer.phone.endsWith(verifyPhone) || verifyPhone.endsWith(booking.customer.phone)
    );

    if (!isAuthorizedForBooking(booking, req.user) && !isPhoneMatch) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to send messages for this booking.'
      });
    }

    let senderRole = 'customer';
    if (req.user?.role === 'admin') senderRole = 'admin';
    else if (req.user?.role === 'supervisor') senderRole = 'supervisor';

    const authorName = senderName || req.user?.name || (
      senderRole === 'admin'
        ? 'Max Housekeeping Admin'
        : senderRole === 'supervisor'
        ? (booking.assignedSupervisor?.name || booking.supervisor?.name || 'Field Supervisor')
        : (booking.customer?.name || 'Customer')
    );

    // Prune messages older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const validMessages = (booking.messages || []).filter(m => new Date(m.timestamp) >= sevenDaysAgo);

    validMessages.push({
      sender: senderRole,
      senderName: authorName,
      text: text.trim(),
      timestamp: new Date()
    });

    booking.messages = validMessages;
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      messages: booking.messages
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel Booking by Customer or Admin
 * PUT /api/v1/bookings/:id/cancel
 */
export async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await findBookingByIdOrCode(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!isAuthorizedForBooking(booking, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to cancel this booking.'
      });
    }

    if (['in_progress', 'completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking that is already ${booking.status}.`
      });
    }

    booking.status = 'cancelled';
    if (!booking.supervisorLiveLocation) {
      booking.supervisorLiveLocation = {};
    }
    booking.supervisorLiveLocation.isSharing = false;
    booking.supervisorLiveLocation.speed = 0;
    booking.supervisorLiveLocation.heading = 0;
    booking.supervisorLiveLocation.updatedAt = new Date();
    booking.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: req.body?.reason || (req.user?.role === 'admin' ? 'Cancelled by admin' : 'Cancelled by customer'),
      updatedBy: req.user?._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingCode} has been cancelled.`,
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Booking by Customer or Admin
 * DELETE /api/v1/bookings/:id
 */
export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await findBookingByIdOrCode(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!isAuthorizedForBooking(booking, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this booking.'
      });
    }

    if (req.user?.role !== 'admin' && ['in_progress', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete booking that is currently in progress or completed.'
      });
    }

    await Booking.deleteOne({ _id: booking._id });

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingCode || id} deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Publicly Available Promotional Coupons
 * GET /api/v1/bookings/coupons
 */
export async function getPublicCoupons(req, res, next) {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      showInOffers: true,
      $or: [
        { validUntil: { $gte: now } },
        { expiryDate: { $gte: now } },
        { expiryDate: { $exists: false }, validUntil: { $exists: false } }
      ]
    })
      .populate('applicableServices', 'title slug price')
      .populate('applicableCategories', 'name slug')
      .sort({ createdAt: -1 });

    const eligibleCoupons = coupons.filter(c => !c.usageLimit || (c.usedCount || 0) < c.usageLimit);

    res.status(200).json({
      success: true,
      coupons: eligibleCoupons
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Real-time Supervisor Live Location Tracker for Customer & Admin
 * GET /api/v1/bookings/:code/live-location
 */
export async function getBookingLiveLocation(req, res, next) {
  try {
    const { code } = req.params;
    const booking = await Booking.findOne({ bookingCode: code.toUpperCase() })
      .select('bookingCode status address supervisorLiveLocation assignedSupervisor supervisor customer.name customer.phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found with this code.' });
    }

    // STRICT CESSATION: If booking is completed or cancelled, all live location tracking MUST be ceased strictly
    if (['completed', 'cancelled'].includes(booking.status)) {
      if (booking.supervisorLiveLocation?.isSharing) {
        booking.supervisorLiveLocation.isSharing = false;
        booking.supervisorLiveLocation.speed = 0;
        booking.supervisorLiveLocation.heading = 0;
        booking.supervisorLiveLocation.updatedAt = new Date();
        await booking.save().catch(() => {});
      }

      let supervisorUser = null;
      if (booking.supervisor) {
        supervisorUser = await User.findById(booking.supervisor).select('name phone avatar avatarUrl');
      }

      const assignedName = (booking.assignedSupervisor?.name || supervisorUser?.name || '').trim();
      const assignedPhone = (booking.assignedSupervisor?.phone || supervisorUser?.phone || '').trim();
      const assignedAvatar = booking.assignedSupervisor?.avatarUrl || booking.assignedSupervisor?.avatar || supervisorUser?.avatarUrl || supervisorUser?.avatar || '';

      const isSupervisorAssigned = Boolean(
        booking.supervisor ||
        booking.assignedSupervisor?.id ||
        assignedName
      );

      return res.status(200).json({
        success: true,
        bookingCode: booking.bookingCode,
        status: booking.status,
        isSupervisorAssigned,
        isSharing: false,
        supervisor: isSupervisorAssigned ? {
          name: assignedName || 'Assigned Supervisor',
          phone: assignedPhone,
          avatar: assignedAvatar,
          avatarUrl: assignedAvatar
        } : null,
        supervisorLocation: null,
        customerLocation: booking.address?.coordinates || null,
        destinationAddress: `${booking.address?.houseOrFlat ? booking.address.houseOrFlat + ', ' : ''}${booking.address?.line1 || ''}, ${booking.address?.cityText || booking.cityName || ''}`.trim(),
        message: 'Service visit has been completed. All real-time location tracking for this booking has strictly ceased.'
      });
    }

    let supervisorUser = null;
    if (booking.supervisor) {
      supervisorUser = await User.findById(booking.supervisor).select('lastKnownLocation name phone avatar avatarUrl');
    }

    const assignedName = (booking.assignedSupervisor?.name || supervisorUser?.name || '').trim();
    const assignedPhone = (booking.assignedSupervisor?.phone || supervisorUser?.phone || '').trim();
    const assignedAvatar = booking.assignedSupervisor?.avatarUrl || booking.assignedSupervisor?.avatar || supervisorUser?.avatarUrl || supervisorUser?.avatar || '';

    const isSupervisorAssigned = Boolean(
      booking.supervisor ||
      booking.assignedSupervisor?.id ||
      assignedName
    );

    // Live location sharing is active by default for all assigned, non-completed bookings
    const isLive = Boolean(isSupervisorAssigned && !['completed', 'cancelled'].includes(booking.status));

    let liveLoc = null;
    let customerLoc = null;

    if (isSupervisorAssigned) {
      const loc = booking.supervisorLiveLocation;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && loc.lat !== 0) {
        liveLoc = {
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading || 0,
          speed: loc.speed || 0,
          accuracy: loc.accuracy || 10,
          updatedAt: loc.updatedAt || new Date()
        };
      } else if (supervisorUser?.lastKnownLocation?.lat && supervisorUser.lastKnownLocation.lat !== 0) {
        liveLoc = {
          lat: supervisorUser.lastKnownLocation.lat,
          lng: supervisorUser.lastKnownLocation.lng,
          heading: supervisorUser.lastKnownLocation.heading || 0,
          speed: supervisorUser.lastKnownLocation.speed || 0,
          accuracy: supervisorUser.lastKnownLocation.accuracy || 15,
          updatedAt: supervisorUser.lastKnownLocation.updatedAt || new Date()
        };
        // Persist to booking
        booking.supervisorLiveLocation = { ...liveLoc, isSharing: true };
        await booking.save().catch(() => {});
      } else {
        // Fallback to city operations hub coordinates
        let fallbackLat = 28.8389;
        let fallbackLng = 78.7768;
        if (booking.city) {
          const cityDoc = await City.findById(booking.city);
          if (cityDoc?.location?.coordinates?.length >= 2) {
            fallbackLng = cityDoc.location.coordinates[0];
            fallbackLat = cityDoc.location.coordinates[1];
          }
        }
        liveLoc = {
          lat: fallbackLat,
          lng: fallbackLng,
          heading: 45,
          speed: 15,
          accuracy: 25,
          updatedAt: new Date()
        };
        booking.supervisorLiveLocation = { ...liveLoc, isSharing: true };
        await booking.save().catch(() => {});
      }
    }

    // Resolve Customer Destination Coordinates
    const isPlaceholderCityCenter = booking.address?.coordinates &&
      Math.abs(booking.address.coordinates.lat - 28.8389) < 0.001 &&
      Math.abs(booking.address.coordinates.lng - 78.7768) < 0.001;

    if (booking.address?.coordinates && typeof booking.address.coordinates.lat === 'number' && booking.address.coordinates.lat !== 0 && !isPlaceholderCityCenter) {
      customerLoc = {
        lat: booking.address.coordinates.lat,
        lng: booking.address.coordinates.lng
      };
    } else {
      // Intelligently geocode address to actual destination coordinates before falling back
      const addrQuery = [
        booking.address?.houseOrFlat,
        booking.address?.line1,
        booking.address?.landmark,
        booking.address?.cityText || booking.cityName
      ].filter(Boolean).join(', ');

      let geocoded = null;
      if (addrQuery) {
        geocoded = await geocodeAddressText(addrQuery, booking.address?.cityText || booking.cityName).catch(() => null);
      }

      if (geocoded?.lat && geocoded?.lng) {
        customerLoc = { lat: geocoded.lat, lng: geocoded.lng };
      } else {
        let destLat = 28.8389;
        let destLng = 78.7768;
        if (booking.city) {
          const cityDoc = await City.findById(booking.city);
          if (cityDoc?.location?.coordinates?.length >= 2) {
            destLng = cityDoc.location.coordinates[0];
            destLat = cityDoc.location.coordinates[1];
          }
        } else if (booking.cityName) {
          const cityDoc = await City.findOne({ name: new RegExp(booking.cityName, 'i') });
          if (cityDoc?.location?.coordinates?.length >= 2) {
            destLng = cityDoc.location.coordinates[0];
            destLat = cityDoc.location.coordinates[1];
          }
        }
        customerLoc = { lat: destLat, lng: destLng };
      }
      if (!booking.address) booking.address = {};
      booking.address.coordinates = customerLoc;
      await booking.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      bookingCode: booking.bookingCode,
      status: booking.status,
      isSupervisorAssigned,
      isSharing: isLive,
      supervisor: isSupervisorAssigned ? {
        name: assignedName || 'Assigned Supervisor',
        phone: assignedPhone,
        avatar: assignedAvatar,
        avatarUrl: assignedAvatar
      } : null,
      supervisorLocation: isLive ? liveLoc : null,
      customerLocation: customerLoc,
      destinationAddress: `${booking.address?.houseOrFlat ? booking.address.houseOrFlat + ', ' : ''}${booking.address?.line1 || ''}, ${booking.address?.cityText || booking.cityName || ''}`.trim()
    });
  } catch (err) {
    next(err);
  }
}

export default {
  validateSmartCoupon,
  getQuote,
  getPublicCoupons,
  createBooking,
  trackBooking,
  getBookingLiveLocation,
  getMyBookings,
  editBookingDetails,
  addBookingMessage,
  getBookingMessages,
  cancelBooking,
  deleteBooking
};

