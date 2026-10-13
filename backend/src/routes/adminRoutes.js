import express from 'express';
import {
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
} from '../controllers/adminController.js';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { verifyAuth, roleGuard } from '../middleware/auth.js';

const router = express.Router();

// Guard all admin routes with authentication and role admin
router.use(verifyAuth, roleGuard('admin'));

// Stats & Dashboard
router.get('/stats', getStats);

// Bookings
router.get('/bookings', getAdminBookings);
router.put('/bookings/:id', updateBooking);

// Services (Shown Price vs Offered Price Management)
router.get('/services', getAdminServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Cities Management (Admin CRUD saved on MongoDB)
router.get('/cities', getAdminCities);
router.post('/cities', createCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

// Registered Users Database (MongoDB Atlas)
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Cloudinary Image Uploads (Services, Testimonials, Brands, Media)
router.post('/upload', upload.single('image'), uploadImage);
router.delete('/upload/:publicId', deleteImage);

// Testimonials Management (Form uploads & Table Management)
router.get('/testimonials', getAdminTestimonials);
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Contact Inquiries Management (Admin Panel view & status)
router.get('/contact-messages', getAdminContactMessages);
router.put('/contact-messages/:id', updateContactMessageStatus);
router.delete('/contact-messages/:id', deleteContactMessage);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
