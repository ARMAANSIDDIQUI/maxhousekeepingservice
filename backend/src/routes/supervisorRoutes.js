import express from 'express';
import {
  getSupervisorStats,
  getSupervisorBookings,
  getSupervisorBookingById,
  verifyBookingOtp,
  uploadBookingPhoto,
  deleteBookingPhoto,
  updateSupervisorBookingStatus,
  addSupervisorBookingMessage,
  getSupervisorSchedule
} from '../controllers/supervisorController.js';
import { uploadPhoto } from '../middleware/upload.js';
import { verifyAuth, roleGuard } from '../middleware/auth.js';

const router = express.Router();

// Guard all supervisor routes with authentication and role supervisor or admin
router.use(verifyAuth, roleGuard('supervisor', 'admin'));

// Stats & Overview
router.get('/stats', getSupervisorStats);
router.get('/schedule', getSupervisorSchedule);

// Assigned Bookings
router.get('/bookings', getSupervisorBookings);
router.get('/bookings/:id', getSupervisorBookingById);

// OTP Verification on Visit
router.post('/bookings/:id/verify-otp', verifyBookingOtp);

// Before and After Service Photo Uploads
router.post('/bookings/:id/photos', uploadPhoto.single('photo'), uploadBookingPhoto);
router.delete('/bookings/:id/photos/:photoId', deleteBookingPhoto);

// Status & Communication
router.put('/bookings/:id/status', updateSupervisorBookingStatus);
router.post('/bookings/:id/message', addSupervisorBookingMessage);

export default router;
