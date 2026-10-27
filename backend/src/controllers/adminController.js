import crypto from 'crypto';
import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Category from '../models/Category.js';
import Booking from '../models/Booking.js';
import City from '../models/City.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import Testimonial from '../models/Testimonial.js';
import { ContactMessage } from '../models/Supporting.js';
import { deleteCloudinaryAsset } from '../config/cloudinary.js';
import { sendBookingStatusUpdateEmail } from '../services/emailService.js';

/**
 * Get Admin Dashboard Overview Statistics
 * GET /api/v1/admin/stats
 */
export async function getStats(req, res, next) {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const totalServices = await Service.countDocuments({ isActive: true });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Calculate total revenue from completed/confirmed bookings
    const revenueAgg = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totals.total' }, totalSaved: { $sum: '$totals.customerSaved' } } }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalCustomerSavings = revenueAgg[0]?.totalSaved || 0;

    // Recent 5 bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalServices,
        totalCustomers,
        totalRevenue,
        totalCustomerSavings
      },
      recentBookings
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Bookings (Admin table with filters)
 * GET /api/v1/admin/bookings
 */
export async function getAdminBookings(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { bookingCode: regex },
        { 'customer.name': regex },
        { 'customer.phone': regex },
        { cityName: regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
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
 * Update Booking Status or Assign Crew
 * PUT /api/v1/admin/bookings/:id
 */
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { status, assignedCrew, note, supervisorId, assignedSlot, serviceOtp } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const previousStatus = booking.status;
    let statusChanged = false;
    let crewChanged = false;

    if (status && status !== booking.status) {
      booking.status = status;
      booking.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status changed to ${status} by admin`,
        updatedBy: req.user?._id
      });
      statusChanged = true;
    }

    if (assignedCrew) {
      booking.assignedCrew = assignedCrew;
      crewChanged = true;
    }

    if (supervisorId !== undefined) {
      if (supervisorId) {
        const sup = await User.findById(supervisorId);
        if (sup && sup.role === 'supervisor') {
          booking.supervisor = sup._id;
          booking.assignedSupervisor = {
            id: sup._id,
            name: sup.name,
            phone: sup.phone,
            email: sup.email,
            assignedAt: new Date()
          };
          if (!booking.serviceOtp) {
            booking.serviceOtp = crypto.randomInt(1000, 10000).toString();
          }
          if (['pending', 'assigned'].includes(booking.status) || !booking.status) {
            booking.status = 'confirmed';
          }
          booking.statusHistory.push({
            status: booking.status,
            timestamp: new Date(),
            note: `Supervisor ${sup.name} assigned to booking. Status automatically updated to confirmed.`,
            updatedBy: req.user?._id
          });
        }
      } else {
        booking.supervisor = undefined;
        booking.assignedSupervisor = undefined;
      }
    }

    if (assignedSlot) {
      booking.assignedSlot = {
        date: assignedSlot.date || booking.slot?.date,
        timeWindow: assignedSlot.timeWindow || assignedSlot.window || booking.slot?.window,
        notes: assignedSlot.notes || ''
      };
      if (assignedSlot.date) booking.slot.date = assignedSlot.date;
      if (assignedSlot.timeWindow || assignedSlot.window) {
        booking.slot.window = assignedSlot.timeWindow || assignedSlot.window;
      }
    }

    if (serviceOtp && typeof serviceOtp === 'string') {
      booking.serviceOtp = serviceOtp.trim();
    }

    // Ensure booking always has a serviceOtp
    if (!booking.serviceOtp) {
      booking.serviceOtp = crypto.randomInt(1000, 10000).toString();
    }

    await booking.save();

    // Trigger email notification to customer if status or crew changed
    if (statusChanged || crewChanged) {
      sendBookingStatusUpdateEmail({
        booking,
        previousStatus,
        newStatus: booking.status,
        note,
        assignedCrew: booking.assignedCrew
      }).catch(err => console.error('[Email Status Update Warning]:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully.',
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Booking Permanently (Admin)
 * DELETE /api/v1/admin/bookings/:id
 */
export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findByIdAndDelete(id);
    }
    if (!booking) {
      booking = await Booking.findOneAndDelete({ bookingCode: id });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingCode || id} deleted permanently.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all services for Admin (includes inactive and full matrix)
 * GET /api/v1/admin/services
 */
export async function getAdminServices(req, res, next) {
  try {
    const services = await Service.find()
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to resolve multiple categories and preserve backwards-compatible primary category
 */
async function resolveCategoriesPayload(payload) {
  let catIds = [];
  if (Array.isArray(payload.categories) && payload.categories.length > 0) {
    catIds = payload.categories.map(c => (c && c._id ? c._id : c)).filter(Boolean);
  } else if (payload.category) {
    const singleId = payload.category && payload.category._id ? payload.category._id : payload.category;
    if (singleId) catIds = [singleId];
  }

  if (catIds.length > 0) {
    const catDocs = await Category.find({ _id: { $in: catIds } });
    if (catDocs.length > 0) {
      const docMap = new Map(catDocs.map(c => [c._id.toString(), c]));
      const orderedDocs = catIds.map(id => docMap.get(id.toString())).filter(Boolean);
      const uniqueDocs = orderedDocs.length > 0 ? orderedDocs : catDocs;

      payload.categories = uniqueDocs.map(c => c._id);
      payload.categorySlugs = uniqueDocs.map(c => c.slug);
      payload.categoryNames = uniqueDocs.map(c => c.name);
      payload.category = uniqueDocs[0]._id;
      payload.categorySlug = uniqueDocs[0].slug;
      payload.categoryName = uniqueDocs[0].name;
      return;
    }
  }

  // Fallback to default category if none found
  let defaultCat = await Category.findOne();
  if (!defaultCat) {
    defaultCat = await Category.create({ name: 'General Cleaning', slug: 'general-cleaning' });
  }
  payload.categories = [defaultCat._id];
  payload.categorySlugs = [defaultCat.slug];
  payload.categoryNames = [defaultCat.name];
  payload.category = defaultCat._id;
  payload.categorySlug = defaultCat.slug;
  payload.categoryName = defaultCat.name;
}

/**
 * Helper to normalize and synchronize service variants, option groups, and matrix
 */
function processVariantsPayload(payload) {
  if (payload.pricingType === 'unit') {
    payload.pricingMode = 'combination';
    const rateMbd = Number(payload.unitRateMoradabad) || Number(payload.price) || 0;
    const rateOther = Number(payload.unitRateOther) || rateMbd;
    if (!payload.price || payload.price === 0) {
      payload.price = rateMbd;
    }
    if (!payload.mrp || payload.mrp === 0) {
      payload.mrp = Math.round(payload.price * 1.25);
    }
    if (payload.mrp > payload.price) {
      payload.discountPct = Math.round(((payload.mrp - payload.price) / payload.mrp) * 100);
    }
    if (Array.isArray(payload.cityRates)) {
      payload.cityRates = payload.cityRates.map(cr => ({
        citySlug: String(cr.citySlug || '').trim().toLowerCase(),
        cityName: String(cr.cityName || cr.citySlug || '').trim(),
        rate: Math.max(0, Number(cr.rate) || 0)
      })).filter(cr => cr.citySlug && cr.rate > 0);
    }
    // If no variants provided for unit pricing, keep matrix empty
    if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
      payload.matrix = [];
      payload.optionGroups = [];
      return;
    }
  }

  if (Array.isArray(payload.variants)) {
    const groupKey = (payload.variantGroupKey || 'size').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const groupLabel = (payload.variantGroupLabel || 'Apartment / House Size').trim();

    const validVariants = payload.variants
      .filter(v => v && (v.label || v.name))
      .map((v, i) => {
        const label = String(v.label || v.name).trim();
        const key = (v.key || label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `var-${i + 1}`;
        const price = Math.max(0, Number(v.price) || 0);
        const mrp = Math.max(price, Number(v.mrp || v.price) || price);
        const duration = v.duration || '1.5 hrs';
        const isDefault = Boolean(v.isDefault ?? (i === 0));
        return { key, label, price, mrp, duration, isDefault };
      });

    if (validVariants.length > 0) {
      const defaultVar = validVariants.find(v => v.isDefault) || validVariants[0];
      payload.price = defaultVar.price;
      payload.mrp = defaultVar.mrp;
      payload.discountPct = defaultVar.mrp > defaultVar.price ? Math.round(((defaultVar.mrp - defaultVar.price) / defaultVar.mrp) * 100) : 0;
      payload.duration = defaultVar.duration;
      payload.pricingMode = payload.pricingType === 'unit' ? 'combination' : 'tiered';

      payload.matrix = validVariants.map(v => ({
        selection: { [groupKey]: v.key },
        price: v.price,
        mrp: v.mrp,
        duration: v.duration,
        isActive: true
      }));

      payload.optionGroups = [
        {
          key: groupKey,
          label: groupLabel,
          type: 'single',
          required: true,
          sortOrder: 0,
          options: validVariants.map(v => ({
            key: v.key,
            label: v.label,
            isDefault: v.isDefault,
            priceDelta: v.price - defaultVar.price,
            mrpDelta: v.mrp - defaultVar.mrp,
            durationDelta: v.duration,
            isActive: true
          }))
        }
      ];
    } else if (payload.pricingType !== 'unit') {
      payload.matrix = [];
      payload.optionGroups = [];
      payload.pricingMode = 'fixed';
    }
  }
}

function sanitizeStringList(val) {
  if (Array.isArray(val)) {
    return val.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }
  return undefined;
}

/**
 * Update Service Dual-Pricing & Details
 * PUT /api/v1/admin/services/:id
 */
export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Process dynamic variants if provided
    processVariantsPayload(updates);

    if (updates.inclusions !== undefined) {
      updates.inclusions = sanitizeStringList(updates.inclusions) || [];
    }
    if (updates.exclusions !== undefined) {
      updates.exclusions = sanitizeStringList(updates.exclusions) || [];
    }
    if (updates.tags !== undefined) {
      updates.tags = sanitizeStringList(updates.tags) || [];
    }
    if (updates.rankingScore !== undefined) {
      updates.rankingScore = Number(updates.rankingScore) || 100;
    }

    // Resolve multi-category selection if provided
    if (updates.categories !== undefined || updates.category !== undefined) {
      await resolveCategoriesPayload(updates);
    }

    // Normalize images and sync media structure
    if (updates.images !== undefined && Array.isArray(updates.images)) {
      updates.images = updates.images.map(img => {
        if (typeof img === 'string') return { url: img, alt: updates.title || '' };
        return { url: img.url, publicId: img.publicId, alt: img.alt || updates.title || '' };
      }).filter(img => Boolean(img.url));

      if (updates.images.length > 0) {
        updates.media = {
          hero: updates.images[0],
          gallery: updates.images.slice(1)
        };
      }
    }

    // Recalculate discountPct if shown price (mrp) or offered price (price) updated
    if (updates.mrp && updates.price) {
      const mrp = Number(updates.mrp);
      const price = Number(updates.price);
      if (mrp > price) {
        updates.discountPct = Math.round(((mrp - price) / mrp) * 100);
      } else {
        updates.discountPct = 0;
      }
    }

    const service = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug').populate('categories', 'name slug');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully with live pricing.',
      service
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a New Service
 * POST /api/v1/admin/services
 */
export async function createService(req, res, next) {
  try {
    const serviceData = { ...req.body };

    // Process dynamic variants if provided
    processVariantsPayload(serviceData);

    if (serviceData.inclusions !== undefined) {
      serviceData.inclusions = sanitizeStringList(serviceData.inclusions) || [];
    }
    if (serviceData.exclusions !== undefined) {
      serviceData.exclusions = sanitizeStringList(serviceData.exclusions) || [];
    }
    if (serviceData.tags !== undefined) {
      serviceData.tags = sanitizeStringList(serviceData.tags) || [];
    }
    if (serviceData.rankingScore !== undefined) {
      serviceData.rankingScore = Number(serviceData.rankingScore) || 100;
    }

    if (!serviceData.slug && serviceData.title) {
      serviceData.slug = serviceData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (serviceData.mrp && serviceData.price) {
      const mrp = Number(serviceData.mrp);
      const price = Number(serviceData.price);
      serviceData.discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    }

    // Resolve multi-category selection
    await resolveCategoriesPayload(serviceData);

    // Normalize images and sync media structure
    if (serviceData.images !== undefined && Array.isArray(serviceData.images)) {
      serviceData.images = serviceData.images.map(img => {
        if (typeof img === 'string') return { url: img, alt: serviceData.title || '' };
        return { url: img.url, publicId: img.publicId, alt: img.alt || serviceData.title || '' };
      }).filter(img => Boolean(img.url));

      if (serviceData.images.length > 0) {
        serviceData.media = {
          hero: serviceData.images[0],
          gallery: serviceData.images.slice(1)
        };
      }
    }

    if (!serviceData.description) {
      serviceData.description = serviceData.shortDescription || `${serviceData.title} by Max Housekeeping Service.`;
    }

    const service = await Service.create(serviceData);

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      service
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Service
 * DELETE /api/v1/admin/services/:id
 */
export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Service deleted.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Manage Coupons
 */
export async function getAdminCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find()
      .populate('applicableServices', 'title slug price')
      .populate('applicableCategories', 'name slug')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req, res, next) {
  try {
    let coupon = await Coupon.create(req.body);
    coupon = await Coupon.findById(coupon._id)
      .populate('applicableServices', 'title slug price')
      .populate('applicableCategories', 'name slug');
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('applicableServices', 'title slug price')
      .populate('applicableCategories', 'name slug');
    res.status(200).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Manage Settings (Business phone, slots, etc.)
 */
export async function getSettings(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        brandName: 'Max Housekeeping Service',
        businessName: 'Max Housekeeping Service',
        phone: '+91 98977 66002',
        primaryPhone: '+91 98977 66002',
        alternatePhone: '',
        secondaryPhone: '',
        whatsappNumber: '+91 98977 66002',
        email: 'contactmaxhousekeepingservice@gmail.com',
        supportEmail: 'contactmaxhousekeepingservice@gmail.com',
        address: 'Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
        workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)'
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Testimonials (Admin)
 * GET /api/v1/admin/testimonials
 */
export async function getAdminTestimonials(req, res, next) {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: testimonials.length, testimonials });
  } catch (err) {
    next(err);
  }
}

/**
 * Create Testimonial (Admin)
 * POST /api/v1/admin/testimonials
 */
export async function createTestimonial(req, res, next) {
  try {
    const { name, role, city, quote, rating, avatar, avatarPublicId, isFeatured, isActive } = req.body;

    if (!name || !city || !quote) {
      return res.status(400).json({ success: false, message: 'Name, city, and quote are required.' });
    }

    const testimonial = await Testimonial.create({
      name: name.trim(),
      role: role ? role.trim() : 'Homeowner',
      city: city.trim(),
      quote: quote.trim(),
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      avatar: avatar || '',
      avatarPublicId: avatarPublicId || '',
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully.',
      testimonial
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Testimonial (Admin)
 * PUT /api/v1/admin/testimonials/:id
 */
export async function updateTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully.',
      testimonial
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Testimonial (Admin)
 * DELETE /api/v1/admin/testimonials/:id
 */
export async function deleteTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }

    if (testimonial.avatarPublicId) {
      deleteCloudinaryAsset(testimonial.avatarPublicId).catch(err =>
        console.warn('[Cloudinary Avatar Delete Warning]:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Contact Messages (Admin)
 * GET /api/v1/admin/contact-messages
 */
export async function getAdminContactMessages(req, res, next) {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Contact Message Status (Admin)
 * PUT /api/v1/admin/contact-messages/:id
 */
export async function updateContactMessageStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Contact message not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Contact message status updated.',
      contact: message
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Contact Message (Admin)
 * DELETE /api/v1/admin/contact-messages/:id
 */
export async function deleteContactMessage(req, res, next) {
  try {
    const { id } = req.params;
    await ContactMessage.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Cities (Admin)
 * GET /api/v1/admin/cities
 */
export async function getAdminCities(req, res, next) {
  try {
    const cities = await City.find().sort({ rankingScore: -1, sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: cities.length, cities });
  } catch (err) {
    next(err);
  }
}

/**
 * Create City (Admin)
 * POST /api/v1/admin/cities
 */
export async function createCity(req, res, next) {
  try {
    const { name, slug, state, serviceRadiusKm, pincodes, status, sortOrder, contactOverrides, tags, rankingScore, rankingTier } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }
    const finalSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const parsedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const city = await City.create({
      name: name.trim(),
      slug: finalSlug,
      state: state || 'Uttar Pradesh',
      location: { type: 'Point', coordinates: [78.7768, 28.8386] },
      serviceRadiusKm: Number(serviceRadiusKm) || 25,
      pincodes: Array.isArray(pincodes) ? pincodes : (typeof pincodes === 'string' ? pincodes.split(',').map(p => p.trim()).filter(Boolean) : []),
      status: status || 'active',
      sortOrder: Number(sortOrder) || 0,
      rankingScore: Number(rankingScore) || 100,
      rankingTier: rankingTier || 'primary',
      tags: parsedTags,
      contactOverrides: contactOverrides || {}
    });
    res.status(201).json({ success: true, message: 'City created successfully', city });
  } catch (err) {
    next(err);
  }
}

/**
 * Update City (Admin)
 * PUT /api/v1/admin/cities/:id
 */
export async function updateCity(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (typeof updateData.pincodes === 'string') {
      updateData.pincodes = updateData.pincodes.split(',').map(p => p.trim()).filter(Boolean);
    }
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (updateData.rankingScore !== undefined) {
      updateData.rankingScore = Number(updateData.rankingScore) || 100;
    }
    const city = await City.findByIdAndUpdate(id, updateData, { new: true });
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.status(200).json({ success: true, message: 'City updated successfully', city });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete City (Admin)
 * DELETE /api/v1/admin/cities/:id
 */
export async function deleteCity(req, res, next) {
  try {
    const { id } = req.params;
    const city = await City.findByIdAndDelete(id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.status(200).json({ success: true, message: 'City deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Registered Users from MongoDB (Admin)
 * GET /api/v1/admin/users
 */
export async function getAdminUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-passwordHash -otpSecret')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update User Role in MongoDB (Admin)
 * PUT /api/v1/admin/users/:id/role
 */
export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin', 'cleaner', 'supervisor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    // Prevent self-demotion of the current administrator
    if (req.user && req.user._id.toString() === id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove admin privileges from your own account.'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete User Account from MongoDB (Admin)
 * DELETE /api/v1/admin/users/:id
 */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent self-deletion of currently logged in admin
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.'
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'User removed from MongoDB database.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Supervisors (Admin)
 * GET /api/v1/admin/supervisors
 */
export async function getAdminSupervisors(req, res, next) {
  try {
    const supervisors = await User.find({ role: 'supervisor' })
      .select('-passwordHash -otpSecret')
      .sort({ createdAt: -1 });

    // Aggregate booking counts per supervisor
    const supervisorIds = supervisors.map(s => s._id);
    const bookingCounts = await Booking.aggregate([
      { $match: { supervisor: { $in: supervisorIds } } },
      {
        $group: {
          _id: '$supervisor',
          totalAssigned: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } }
        }
      }
    ]);

    const countMap = new Map(bookingCounts.map(b => [String(b._id), b]));

    const supervisorsWithStats = supervisors.map(s => {
      const stats = countMap.get(String(s._id)) || { totalAssigned: 0, completed: 0, inProgress: 0 };
      return {
        ...s.toObject(),
        status: s.isActive ? 'active' : 'suspended',
        totalAssigned: stats.totalAssigned,
        completed: stats.completed,
        inProgress: stats.inProgress
      };
    });

    res.status(200).json({
      success: true,
      count: supervisorsWithStats.length,
      supervisors: supervisorsWithStats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create Supervisor Account (Admin)
 * POST /api/v1/admin/supervisors
 */
export async function createSupervisor(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supervisor name is required.' });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Either email or phone is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : '';

    // Check duplicate email or phone
    const orConditions = [];
    if (cleanEmail) orConditions.push({ email: cleanEmail });
    if (cleanPhone) orConditions.push({ phone: cleanPhone });

    if (orConditions.length > 0) {
      const existing = await User.findOne({ $or: orConditions });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email or phone number already exists.'
        });
      }
    }

    const avatarUrl = User.generateDefaultAvatar ? User.generateDefaultAvatar(name) : '';

    const supervisor = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: password, // Mongoose pre-save hook will hash this securely
      role: 'supervisor',
      authProvider: 'local',
      avatarUrl,
      emailVerified: true,
      isActive: true
    });

    await supervisor.save();

    const safeSupervisor = supervisor.toObject();
    delete safeSupervisor.passwordHash;
    delete safeSupervisor.otpSecret;
    safeSupervisor.status = safeSupervisor.isActive ? 'active' : 'suspended';

    res.status(201).json({
      success: true,
      message: `Supervisor ${supervisor.name} created successfully.`,
      supervisor: safeSupervisor
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Supervisor Details (Admin)
 * PUT /api/v1/admin/supervisors/:id
 */
export async function updateSupervisor(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, password, isActive, status } = req.body;

    const supervisor = await User.findById(id);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({ success: false, message: 'Supervisor account not found.' });
    }

    if (name) supervisor.name = name.trim();
    if (email !== undefined) supervisor.email = email ? email.trim().toLowerCase() : undefined;
    if (phone !== undefined) supervisor.phone = phone ? phone.trim().replace(/\D/g, '') : '';
    if (status !== undefined) supervisor.isActive = (status === 'active');
    if (isActive !== undefined) supervisor.isActive = Boolean(isActive);

    if (password && password.trim().length >= 6) {
      supervisor.passwordHash = password.trim(); // Will be hashed by pre-save hook
    }

    await supervisor.save();

    const safeSupervisor = supervisor.toObject();
    delete safeSupervisor.passwordHash;
    delete safeSupervisor.otpSecret;
    safeSupervisor.status = safeSupervisor.isActive ? 'active' : 'suspended';

    res.status(200).json({
      success: true,
      message: 'Supervisor account updated successfully.',
      supervisor: safeSupervisor
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Supervisor Account (Admin)
 * DELETE /api/v1/admin/supervisors/:id
 */
export async function deleteSupervisor(req, res, next) {
  try {
    const { id } = req.params;
    const supervisor = await User.findById(id);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({ success: false, message: 'Supervisor account not found.' });
    }

    // Unassign pending bookings from this supervisor
    await Booking.updateMany(
      { supervisor: id, status: { $nin: ['completed', 'cancelled'] } },
      { $unset: { supervisor: 1, assignedSupervisor: 1 } }
    );

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Supervisor account deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to parse time window string into start and end minutes from midnight (0-1440)
 * Handles "08:00 AM - 10:00 AM", "Morning (8:00 AM – 11:00 AM)", etc.
 */
export function parseTimeWindowRange(windowStr) {
  if (!windowStr || typeof windowStr !== 'string') return null;
  const clean = windowStr.replace(/[\u2013\u2014]/g, '-');
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
  const matches = [...clean.matchAll(timeRegex)];
  if (matches.length >= 2) {
    const parseToMinutes = (h, m, meridiem) => {
      let hours = parseInt(h, 10);
      const minutes = m ? parseInt(m, 10) : 0;
      if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    return {
      start: parseToMinutes(matches[0][1], matches[0][2], matches[0][3]),
      end: parseToMinutes(matches[1][1], matches[1][2], matches[1][3])
    };
  }
  return null;
}

/**
 * Checks whether two time window intervals overlap
 */
export function doTimeWindowsOverlap(winA, winB) {
  if (!winA || !winB) return false;
  const cleanA = String(winA).trim().toLowerCase().replace(/[\u2013\u2014]/g, '-');
  const cleanB = String(winB).trim().toLowerCase().replace(/[\u2013\u2014]/g, '-');
  if (cleanA === cleanB) return true;

  const rangeA = parseTimeWindowRange(cleanA);
  const rangeB = parseTimeWindowRange(cleanB);
  if (rangeA && rangeB) {
    return Math.max(rangeA.start, rangeB.start) < Math.min(rangeA.end, rangeB.end);
  }
  return cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

/**
 * Assign Supervisor and Time Slot to Booking (Admin)
 * PUT /api/v1/admin/bookings/:id/assign
 */
export async function assignSupervisorToBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { supervisorId, assignedSlot, note, allowConflict } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!supervisorId) {
      return res.status(400).json({ success: false, message: 'Please select a supervisor.' });
    }

    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(400).json({ success: false, message: 'Selected user is not a valid supervisor.' });
    }

    // Determine target slot date and window
    const targetDate = assignedSlot?.date || booking.slot?.date;
    const targetWindow = assignedSlot?.timeWindow || assignedSlot?.window || booking.slot?.window;

    // Time slot conflict check: verify supervisor is not already booked in an overlapping slot
    if (targetDate && targetWindow && !allowConflict) {
      const datePrefix = String(targetDate).slice(0, 10);
      const candidateBookings = await Booking.find({
        _id: { $ne: booking._id },
        status: { $in: ['confirmed', 'in_progress', 'pending', 'assigned', 'approved'] },
        $or: [
          { supervisor: supervisor._id },
          { 'assignedSupervisor.id': supervisor._id }
        ],
        $and: [
          {
            $or: [
              { 'assignedSlot.date': new RegExp('^' + datePrefix) },
              { 'slot.date': new RegExp('^' + datePrefix) }
            ]
          }
        ]
      }).select('bookingCode serviceTitle customer slot assignedSlot status');

      const existingConflict = candidateBookings.find(b => {
        const bWindow = b.assignedSlot?.timeWindow || b.slot?.window;
        return doTimeWindowsOverlap(bWindow, targetWindow);
      });

      if (existingConflict) {
        return res.status(409).json({
          success: false,
          conflict: true,
          conflictingBooking: {
            _id: existingConflict._id,
            bookingCode: existingConflict.bookingCode,
            serviceTitle: existingConflict.serviceTitle,
            customerName: existingConflict.customer?.name || 'Customer',
            slotDate: existingConflict.assignedSlot?.date || existingConflict.slot?.date,
            timeWindow: existingConflict.assignedSlot?.timeWindow || existingConflict.slot?.window,
            status: existingConflict.status
          },
          message: `Time Slot Conflict: Supervisor ${supervisor.name} is already allotted to Booking #${existingConflict.bookingCode} (${existingConflict.serviceTitle || 'Service'}) on this date during ${existingConflict.assignedSlot?.timeWindow || existingConflict.slot?.window}. Enable admin override if you wish to proceed.`
        });
      }
    }

    booking.supervisor = supervisor._id;
    booking.assignedSupervisor = {
      id: supervisor._id,
      name: supervisor.name,
      phone: supervisor.phone,
      email: supervisor.email,
      avatar: supervisor.avatar || supervisor.avatarUrl || '',
      assignedAt: new Date()
    };

    if (assignedSlot) {
      booking.assignedSlot = {
        date: assignedSlot.date || booking.slot?.date,
        timeWindow: assignedSlot.timeWindow || assignedSlot.window || booking.slot?.window,
        notes: assignedSlot.notes || ''
      };
      if (assignedSlot.date) booking.slot.date = assignedSlot.date;
      if (assignedSlot.timeWindow || assignedSlot.window) {
        booking.slot.window = assignedSlot.timeWindow || assignedSlot.window;
      }
    }

    // Ensure 4-digit service verification OTP is set for customer visit
    if (!booking.serviceOtp) {
      booking.serviceOtp = crypto.randomInt(1000, 10000).toString();
    }

    // Update status automatically to confirmed when supervisor is assigned
    if (['pending', 'assigned'].includes(booking.status) || !booking.status) {
      booking.status = 'confirmed';
    }

    const assignmentNote = note || `Assigned to supervisor ${supervisor.name} for slot: ${booking.slot.date} (${booking.slot.window}). Status automatically confirmed.`;
    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: assignmentNote,
      updatedBy: req.user?._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Supervisor ${supervisor.name} assigned to booking ${booking.bookingCode}.`,
      booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Check Supervisors Slot Availability (Admin)
 * GET /api/v1/admin/supervisors/slot-availability?date=YYYY-MM-DD&timeWindow=...&excludeBookingId=...
 */
export async function getSupervisorSlotAvailability(req, res, next) {
  try {
    const { date, timeWindow, excludeBookingId } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required for availability check.' });
    }

    const supervisors = await User.find({ role: 'supervisor', status: 'active' })
      .select('name email phone city avatar status')
      .sort({ name: 1 })
      .lean();

    const datePrefix = String(date).slice(0, 10);

    // Query all active bookings for this date
    const bookingQuery = {
      status: { $in: ['confirmed', 'in_progress', 'pending', 'assigned', 'approved'] },
      $or: [
        { 'assignedSlot.date': new RegExp('^' + datePrefix) },
        { 'slot.date': new RegExp('^' + datePrefix) }
      ]
    };
    if (excludeBookingId) {
      bookingQuery._id = { $ne: excludeBookingId };
    }

    const dayBookings = await Booking.find(bookingQuery)
      .select('supervisor assignedSupervisor slot assignedSlot status bookingCode serviceTitle customer')
      .lean();

    const availability = supervisors.map(sup => {
      const supIdStr = sup._id.toString();

      // All bookings for this supervisor on this date
      const supDayBookings = dayBookings.filter(b => 
        (b.supervisor && b.supervisor.toString() === supIdStr) ||
        (b.assignedSupervisor?.id && b.assignedSupervisor.id.toString() === supIdStr)
      );

      // Check slot conflict if timeWindow specified
      let isBusyInSlot = false;
      let slotConflictBooking = null;

      if (timeWindow) {
        slotConflictBooking = supDayBookings.find(b => {
          const bWindow = b.assignedSlot?.timeWindow || b.slot?.window;
          return doTimeWindowsOverlap(bWindow, timeWindow);
        });
        isBusyInSlot = Boolean(slotConflictBooking);
      }

      return {
        _id: sup._id,
        name: sup.name,
        email: sup.email,
        phone: sup.phone,
        city: sup.city,
        avatar: sup.avatar,
        status: sup.status,
        dayBookingsCount: supDayBookings.length,
        isAvailableInSlot: !isBusyInSlot,
        conflictBooking: slotConflictBooking ? {
          bookingCode: slotConflictBooking.bookingCode,
          serviceTitle: slotConflictBooking.serviceTitle,
          customerName: slotConflictBooking.customer?.name,
          timeWindow: slotConflictBooking.assignedSlot?.timeWindow || slotConflictBooking.slot?.window,
          status: slotConflictBooking.status
        } : null,
        dayBookings: supDayBookings.map(b => ({
          bookingCode: b.bookingCode,
          serviceTitle: b.serviceTitle,
          timeWindow: b.assignedSlot?.timeWindow || b.slot?.window,
          status: b.status
        }))
      };
    });

    res.status(200).json({
      success: true,
      date,
      timeWindow: timeWindow || null,
      supervisors: availability
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all categories (Admin)
 * GET /api/v1/admin/categories
 */
export async function getAdminCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
    
    // Compute service count for each category
    const counts = await Service.aggregate([
      {
        $project: {
          allCats: {
            $setUnion: [
              { $cond: [{ $ifNull: ['$category', false] }, ['$category'], []] },
              { $ifNull: ['$categories', []] }
            ]
          }
        }
      },
      { $unwind: '$allCats' },
      { $group: { _id: '$allCats', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });

    const enriched = categories.map(cat => ({
      ...cat.toObject(),
      serviceCount: countMap[cat._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      categories: enriched
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create Category (Admin)
 * POST /api/v1/admin/categories
 */
export async function createCategory(req, res, next) {
  try {
    const { name, slug, tagline, iconKey, image, sortOrder, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const finalSlug = (slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await Category.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: `Category with slug "${finalSlug}" already exists.` });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      tagline: tagline ? tagline.trim() : undefined,
      iconKey: iconKey || 'PiHouseLine',
      image: image || undefined,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Category (Admin)
 * PUT /api/v1/admin/categories/:id
 */
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, tagline, iconKey, image, sortOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) category.name = name.trim();
    if (slug) {
      const newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (newSlug !== category.slug) {
        const existing = await Category.findOne({ slug: newSlug, _id: { $ne: id } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Category slug "${newSlug}" is already taken.` });
        }
        category.slug = newSlug;
      }
    }
    if (tagline !== undefined) category.tagline = tagline.trim();
    if (iconKey !== undefined) category.iconKey = iconKey;
    if (image !== undefined) category.image = image;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    // Sync updated name and slug in any services referencing this category
    await Service.updateMany(
      { category: category._id },
      { categoryName: category.name, categorySlug: category.slug }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete Category (Admin)
 * DELETE /api/v1/admin/categories/:id
 */
export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check if services are assigned to this category
    const linkedServices = await Service.find({
      $or: [{ category: id }, { categories: id }]
    });

    if (linkedServices.length > 0) {
      const replacement = await Category.findOne({ _id: { $ne: id } });
      if (replacement) {
        for (const svc of linkedServices) {
          svc.categories = (svc.categories || []).filter(c => c.toString() !== id);
          if (svc.category && svc.category.toString() === id) {
            svc.category = svc.categories[0] || replacement._id;
            svc.categoryName = svc.categories[0] ? svc.categoryNames[0] : replacement.name;
            svc.categorySlug = svc.categories[0] ? svc.categorySlugs[0] : replacement.slug;
          }
          await svc.save();
        }
      }
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getStats,
  getAdminBookings,
  updateBooking,
  getAdminServices,
  updateService,
  createService,
  deleteService,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getSettings,
  updateSettings,
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAdminContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getAdminCities,
  createCity,
  updateCity,
  deleteCity,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminSupervisors,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  assignSupervisorToBooking,
  getSupervisorSlotAvailability
};
