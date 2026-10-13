import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import City from '../models/City.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { calculateQuote } from '../services/pricing/engine.js';
import { sendBookingConfirmationEmail, sendAdminNewBookingNotification } from '../services/emailService.js';

/**
 * Generate Live Price Quote with Dual-Pricing Breakdown
 * POST /api/v1/bookings/quote
 */
export async function getQuote(req, res, next) {
  try {
    const { items = [], citySlug, couponCode } = req.body;

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

    // Check coupon if provided
    let coupon = null;
    if (couponCode && couponCode.trim()) {
      coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() }
      });
    }

    const calculation = calculateQuote(enrichedItems, citySlug, coupon);

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
      saveAddressToProfile // Boolean to save newly entered permanent address
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one service.' });
    }

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required.' });
    }

    if (!address?.line1 || !address?.cityText || !address?.pincode) {
      return res.status(400).json({ success: false, message: 'Complete service address is required.' });
    }

    if (!slot?.date || !slot?.window) {
      return res.status(400).json({ success: false, message: 'Booking date and time window are required.' });
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
      coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() }
      });
    }

    const quote = calculateQuote(enrichedItems, cityDoc?.slug, coupon);

    // Generate unique human-readable Booking Code (e.g. MH-2026-8921)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const bookingCode = `MH-${year}-${randomCode}`;

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

    const bookingData = {
      bookingCode,
      user: req.user ? req.user._id : undefined,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim() : undefined
      },
      items: itemSnapshots,
      city: cityDoc._id,
      cityName: cityDoc.name,
      address: {
        line1: address.line1.trim(),
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
      status: 'pending',
      totals: quote.totals,
      appliedCoupon: quote.coupon,
      paymentMode: paymentMode || 'cash_on_service',
      paymentStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Booking submitted by customer'
      }]
    };

    const newBooking = await Booking.create(bookingData);

    // Automated Email Dispatch: Customer Confirmation + Admin Alert
    Promise.allSettled([
      sendBookingConfirmationEmail({ booking: newBooking, customerEmail: newBooking.customer?.email }),
      sendAdminNewBookingNotification({ booking: newBooking })
    ]).catch(emailErr => {
      console.warn('[Email Automation Notice]:', emailErr.message);
    });

    // Save to user address book if authenticated, asked to save, and NOT temporary
    if (req.user && saveAddressToProfile && !isTempAddress) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.addresses.push({
          label: address.label || 'Home',
          line1: address.line1.trim(),
          landmark: address.landmark ? address.landmark.trim() : '',
          city: address.cityText.trim(),
          state: address.stateText || 'Uttar Pradesh',
          pincode: address.pincode.trim(),
          isDefault: user.addresses.length === 0
        });
        await user.save();
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
 * Track Booking by Code
 * GET /api/v1/bookings/track/:code
 */
export async function trackBooking(req, res, next) {
  try {
    const { code } = req.params;
    const booking = await Booking.findOne({ bookingCode: code.toUpperCase() })
      .populate('city', 'name contactOverrides');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No booking found with this reference code.'
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
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Edit Booking Details by Customer
 * PUT /api/v1/bookings/:id/edit
 */
export async function editBookingDetails(req, res, next) {
  try {
    const { id } = req.params;
    const { customer, address, slot, notes } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (['completed', 'cancelled', 'in_progress'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit booking that is already in progress, completed, or cancelled.'
      });
    }

    if (customer?.name) booking.customer.name = customer.name.trim();
    if (customer?.phone) booking.customer.phone = customer.phone.trim();
    if (customer?.email) booking.customer.email = customer.email.trim();

    if (address?.line1) booking.address.line1 = address.line1.trim();
    if (address?.landmark !== undefined) booking.address.landmark = address.landmark.trim();
    if (address?.pincode) booking.address.pincode = address.pincode.trim();
    if (address?.cityText) booking.address.cityText = address.cityText.trim();

    if (slot?.date) booking.slot.date = slot.date;
    if (slot?.window) booking.slot.window = slot.window;
    if (notes !== undefined) booking.notes = notes.trim();

    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: 'Details updated by customer',
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
 * Add message to booking communication thread (Customer <-> Admin)
 * POST /api/v1/bookings/:id/messages
 */
export async function addBookingMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { text, senderName } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const senderRole = req.user?.role === 'admin' ? 'admin' : 'customer';
    const authorName = senderName || req.user?.name || (senderRole === 'admin' ? 'Max Housekeeping Admin' : booking.customer.name);

    booking.messages.push({
      sender: senderRole,
      senderName: authorName,
      text: text.trim(),
      timestamp: new Date()
    });

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

export default {
  getQuote,
  createBooking,
  trackBooking,
  getMyBookings,
  editBookingDetails,
  addBookingMessage
};
