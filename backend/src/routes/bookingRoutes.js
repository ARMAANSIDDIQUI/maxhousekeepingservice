import express from 'express';
import {
  getQuote,
  getPublicCoupons,
  createBooking,
  trackBooking,
  getMyBookings,
  editBookingDetails,
  addBookingMessage,
  getBookingMessages,
  cancelBooking,
  deleteBooking
} from '../controllers/bookingController.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/coupons', optionalAuth, getPublicCoupons);
router.post('/quote', optionalAuth, getQuote);
router.post('/', verifyAuth, createBooking);
router.get('/track/:code', optionalAuth, trackBooking);
router.get('/my', verifyAuth, getMyBookings);
router.put('/:id/edit', verifyAuth, editBookingDetails);
router.put('/:id/cancel', verifyAuth, cancelBooking);
router.delete('/:id', verifyAuth, deleteBooking);
router.get('/:id/messages', optionalAuth, getBookingMessages);
router.post('/:id/messages', optionalAuth, addBookingMessage);

export default router;

