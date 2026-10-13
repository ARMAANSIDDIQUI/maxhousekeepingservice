import express from 'express';
import {
  getQuote,
  createBooking,
  trackBooking,
  getMyBookings,
  editBookingDetails,
  addBookingMessage
} from '../controllers/bookingController.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/quote', getQuote);
router.post('/', optionalAuth, createBooking);
router.get('/track/:code', trackBooking);
router.get('/my', verifyAuth, getMyBookings);
router.put('/:id/edit', optionalAuth, editBookingDetails);
router.post('/:id/messages', optionalAuth, addBookingMessage);

export default router;
