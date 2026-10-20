import express from 'express';
import {
  getQuote,
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

router.post('/quote', getQuote);
router.post('/', verifyAuth, createBooking);
router.get('/track/:code', optionalAuth, trackBooking);
router.get('/my', verifyAuth, getMyBookings);
router.put('/:id/edit', verifyAuth, editBookingDetails);
router.put('/:id/cancel', verifyAuth, cancelBooking);
router.delete('/:id', verifyAuth, deleteBooking);
router.get('/:id/messages', verifyAuth, getBookingMessages);
router.post('/:id/messages', verifyAuth, addBookingMessage);

export default router;

