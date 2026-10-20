import express from 'express';
import {
  sendSignupOtp,
  register,
  login,
  requestOtp,
  verifyOtp,
  googleLogin,
  getMe,
  logout,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/signup-otp', sendSignupOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

// Protected endpoints
router.get('/me', verifyAuth, getMe);
router.put('/profile', verifyAuth, updateProfile);
router.put('/change-password', verifyAuth, changePassword);
router.post('/addresses', verifyAuth, addAddress);
router.put('/addresses/:id', verifyAuth, updateAddress);
router.put('/addresses/:id/default', verifyAuth, setDefaultAddress);
router.delete('/addresses/:id', verifyAuth, deleteAddress);

export default router;
