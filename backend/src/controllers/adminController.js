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
    const { status, assignedCrew, note } = req.body;

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
    const booking = await Booking.findByIdAndDelete(id);

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
      payload.pricingMode = 'tiered';

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
    } else {
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
      serviceData.description = serviceData.shortDescription || `${serviceData.title} by Max House Keeping Service.`;
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
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        brandName: 'Max House Keeping Service',
        businessName: 'Max House Keeping Service',
        phone: '+91 98977 66002',
        primaryPhone: '+91 98977 66002',
        alternatePhone: '+91 82105 23309',
        secondaryPhone: '+91 82105 23309',
        whatsappNumber: '+91 98977 66002',
        email: 'vikasmax321@gmail.com',
        supportEmail: 'vikasmax321@gmail.com',
        address: 'Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
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
    const cities = await City.find().sort({ sortOrder: 1, name: 1 });
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
    const { name, slug, state, serviceRadiusKm, pincodes, status, sortOrder, contactOverrides } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }
    const finalSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const city = await City.create({
      name: name.trim(),
      slug: finalSlug,
      state: state || 'Uttar Pradesh',
      location: { type: 'Point', coordinates: [78.7768, 28.8386] },
      serviceRadiusKm: Number(serviceRadiusKm) || 25,
      pincodes: Array.isArray(pincodes) ? pincodes : (typeof pincodes === 'string' ? pincodes.split(',').map(p => p.trim()).filter(Boolean) : []),
      status: status || 'active',
      sortOrder: Number(sortOrder) || 0,
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

    if (!['customer', 'admin', 'cleaner'].includes(role)) {
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
  deleteUser
};
