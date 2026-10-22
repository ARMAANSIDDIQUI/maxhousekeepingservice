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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    let settings = await Settings.findOne();
    if (!settings) {
      settings = {
        brandName: 'Max Housekeeping Service',
        businessName: 'Max Housekeeping Service',
        tagline: 'A spotless home, without lifting a finger.',
        phone: '+91 98977 66002',
        primaryPhone: '+91 98977 66002',
        alternatePhone: '',
        secondaryPhone: '',
        whatsappNumber: '+91 98977 66002',
        email: 'contactmaxhousekeepingservice@gmail.com',
        supportEmail: 'contactmaxhousekeepingservice@gmail.com',
        address: 'Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
        workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)'
      };
    }
    const publicSettings = settings.toObject ? settings.toObject() : { ...settings };
    delete publicSettings.razorpayKeySecret; // Never leak secret key

    // Expose public Google Client ID for OAuth
    publicSettings.googleClientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      '672677706855-2gii7cnf1qim21jllnl8ffvjid61b3eh.apps.googleusercontent.com';

    // If keyId is not set in DB, fallback to process.env.RAZORPAY_KEY_ID if defined
    if (!publicSettings.razorpayKeyId && process.env.RAZORPAY_KEY_ID) {
      publicSettings.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    }

    res.status(200).json({ success: true, settings: publicSettings });
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

    // Dispatch automated emails: 1 to self/admin, 1 to user confirmation
    try {
      const emailTasks = [sendContactNotificationToAdmin({ contact })];
      if (contact.email) {
        emailTasks.push(sendContactConfirmationToUser({ contact }));
      }
      await Promise.allSettled(emailTasks);
    } catch (emailErr) {
      console.warn('[Contact Email Automation Notice]:', emailErr.message);
    }

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
