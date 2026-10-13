import express from 'express';
import {
  login,
  requestOtp,
  verifyOtp,
  googleLogin,
  getMe,
  logout,
  addAddress,
  deleteAddress
} from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google', googleLogin);
router.post('/logout', logout);

// Protected endpoints
router.get('/me', verifyAuth, getMe);
router.post('/addresses', verifyAuth, addAddress);
router.delete('/addresses/:id', verifyAuth, deleteAddress);

export default router;
