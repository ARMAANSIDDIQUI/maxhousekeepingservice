import express from 'express';
import {
  getSupervisorStats,
  getSupervisorBookings,
  getSupervisorBookingById,
  verifyBookingOtp,
  uploadBookingPhoto,
  deleteBookingPhoto,
  updateSupervisorBookingStatus,
  updateSupervisorLiveLocation,
  broadcastSupervisorLiveLocation,
  addSupervisorBookingMessage,
  getSupervisorSchedule,
  getSupervisorsList,
  getUnassignedPool,
  claimSupervisorBooking,
  createQuickTestBooking
} from '../controllers/supervisorController.js';
import { uploadPhoto } from '../middleware/upload.js';
import { verifyAuth, roleGuard } from '../middleware/auth.js';

const router = express.Router();

// Guard all supervisor routes with authentication and role supervisor or admin
router.use(verifyAuth, roleGuard('supervisor', 'admin'));

// Stats & Overview
router.get('/stats', getSupervisorStats);
router.get('/schedule', getSupervisorSchedule);
router.get('/supervisors', getSupervisorsList);
router.get('/pool', getUnassignedPool);

// Assigned Bookings
router.get('/bookings', getSupervisorBookings);
router.get('/bookings/:id', getSupervisorBookingById);

// OTP Verification on Visit
router.post('/bookings/:id/verify-otp', verifyBookingOtp);

// Self-Claiming & Quick Dispatch Creation
router.post('/bookings/:id/claim', claimSupervisorBooking);
router.post('/quick-test-booking', createQuickTestBooking);

// Before and After Service Photo Uploads
router.post('/bookings/:id/photos', uploadPhoto.single('photo'), uploadBookingPhoto);
router.delete('/bookings/:id/photos/:photoId', deleteBookingPhoto);

// Status & Communication & Live GPS
router.put('/bookings/:id/status', updateSupervisorBookingStatus);
router.post('/location/broadcast', broadcastSupervisorLiveLocation);
router.post('/bookings/:id/location', updateSupervisorLiveLocation);
router.post('/bookings/:id/message', addSupervisorBookingMessage);

export default router;
