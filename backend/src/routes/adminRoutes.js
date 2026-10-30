import express from 'express';
import {
  getStats,
  getAdminBookings,
  updateBooking,
  deleteBooking,
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
  getSupervisorSlotAvailability,
  updateBookingSupervisorLocation
} from '../controllers/adminController.js';
import { uploadImage, uploadMultipleImages, uploadVideo, deleteImage } from '../controllers/uploadController.js';
import { upload, uploadVideo as multerUploadVideo } from '../middleware/upload.js';
import { verifyAuth, roleGuard } from '../middleware/auth.js';

const router = express.Router();

// Guard all admin routes with authentication and role admin
router.use(verifyAuth, roleGuard('admin'));

// Stats & Dashboard
router.get('/stats', getStats);

// Bookings
router.get('/bookings', getAdminBookings);
router.put('/bookings/:id', updateBooking);
router.put('/bookings/:id/assign', assignSupervisorToBooking);
router.put('/bookings/:id/supervisor-location', updateBookingSupervisorLocation);
router.delete('/bookings/:id', deleteBooking);

// Supervisor ID Management (Created & Managed by Admins)
router.get('/supervisors/slot-availability', getSupervisorSlotAvailability);
router.get('/supervisors', getAdminSupervisors);
router.post('/supervisors', createSupervisor);
router.put('/supervisors/:id', updateSupervisor);
router.delete('/supervisors/:id', deleteSupervisor);

// Services (Shown Price vs Offered Price Management)
router.get('/services', getAdminServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Categories Management (Admin CRUD saved on MongoDB)
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Cities Management (Admin CRUD saved on MongoDB)
router.get('/cities', getAdminCities);
router.post('/cities', createCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

// Registered Users Database (MongoDB Atlas)
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Cloudinary Image & Video Uploads
router.post('/upload', upload.single('image'), uploadImage);
router.post('/upload-multiple', upload.array('images', 15), uploadMultipleImages);
router.post('/upload-video', multerUploadVideo.single('video'), uploadVideo);
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
