import Brand from '../models/Brand.js';
import Testimonial from '../models/Testimonial.js';
import Settings from '../models/Settings.js';
import { ContactMessage, WaitlistRequest } from '../models/Supporting.js';
import { sendContactNotificationToAdmin, sendContactConfirmationToUser } from '../services/emailService.js';

export async function getBrands(req, res, next) {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ sortOrder: 1 });
    res.status(200).json({ success: true, count: brands.length, brands });
  } catch (err) {
    next(err);
  }
}

export async function getTestimonials(req, res, next) {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: testimonials.length, testimonials });
  } catch (err) {
    next(err);
  }
}

export async function getPublicSettings(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = {
        businessName: 'Max House Keeping Service',
        tagline: 'Housekeeping & Commercial Cleaning Experts',
        primaryPhone: '9897766002',
        secondaryPhone: '8210523309',
        supportEmail: 'contact@maxhousekeepingservice.com',
        headquarters: {
          address: 'Moradabad, Uttar Pradesh, India',
          city: 'Moradabad',
          state: 'Uttar Pradesh'
        },
        workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)'
      };
    }
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

export async function submitContact(req, res, next) {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and message are required.'
      });
    }

    const contact = await ContactMessage.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim()
    });

    // Dispatch automated emails to Admin and User
    Promise.allSettled([
      sendContactNotificationToAdmin({ contact }),
      sendContactConfirmationToUser({ contact })
    ]).catch(emailErr => {
      console.warn('[Contact Email Automation Notice]:', emailErr.message);
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received. Our team will contact you shortly.',
      contactId: contact._id
    });
  } catch (err) {
    next(err);
  }
}

export async function joinWaitlist(req, res, next) {
  try {
    const { name, phone, city, pincode, serviceNeeded } = req.body;

    if (!name || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and city are required.'
      });
    }

    const request = await WaitlistRequest.create({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      pincode: pincode ? pincode.trim() : '',
      serviceNeeded: serviceNeeded ? serviceNeeded.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: `Thank you for your interest! We will notify you as soon as Max Housekeeping launches in ${city}.`,
      requestId: request._id
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getBrands,
  getTestimonials,
  getPublicSettings,
  submitContact,
  joinWaitlist
};
