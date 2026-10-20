import express from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', verifyAuth, createPaymentOrder);
router.post('/verify', verifyAuth, verifyPayment);

export default router;
