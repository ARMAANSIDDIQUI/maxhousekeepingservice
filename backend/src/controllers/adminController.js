import Service from '../models/Service.js';
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

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
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
 * Get all services for Admin (includes inactive and full matrix)
 * GET /api/v1/admin/services
 */
export async function getAdminServices(req, res, next) {
  try {
    const services = await Service.find()
      .populate('category', 'name slug')
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
 * Update Service Dual-Pricing & Details
 * PUT /api/v1/admin/services/:id
 */
export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

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
    }).populate('category', 'name slug');

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
    const serviceData = req.body;

    if (serviceData.mrp && serviceData.price) {
      const mrp = Number(serviceData.mrp);
      const price = Number(serviceData.price);
      serviceData.discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
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
        businessName: 'Max House Keeping Service',
        primaryPhone: '9897766002',
        secondaryPhone: '8210523309',
        supportEmail: 'contact@maxhousekeepingservice.com'
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
      .select('-passwordHash')
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

export default {
  getStats,
  getAdminBookings,
  updateBooking,
  getAdminServices,
  updateService,
  createService,
  deleteService,
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
