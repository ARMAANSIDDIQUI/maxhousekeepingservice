import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import { sendBookingConfirmationEmail, sendAdminNewBookingNotification } from '../services/emailService.js';
import { isAuthorizedForBooking } from './bookingController.js';

/**
 * Create Payment Order (Razorpay / Gateway)
 * POST /api/v1/payments/create-order
 */
export async function createPaymentOrder(req, res, next) {
  try {
    const { amount, bookingCode, customerName, customerPhone, customerEmail } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required.'
      });
    }

    const settings = await Settings.findOne().select('+razorpayKeySecret');
    if (!settings?.acceptOnlinePayments) {
      return res.status(400).json({
        success: false,
        message: 'Online payments are currently disabled by administration. Please choose Cash on Service.'
      });
    }

    if (bookingCode) {
      const existingBooking = await Booking.findOne({ bookingCode: bookingCode.trim() });
      if (existingBooking && !isAuthorizedForBooking(existingBooking, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to create payment for this reservation.'
        });
      }
    }

    const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '';
    const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';
    const amountInPaise = Math.round(Number(amount) * 100);

    // Enforce configured credentials
    if (!keyId || !keySecret) {
      return res.status(400).json({
        success: false,
        message: 'Online payment gateway is not configured yet. Please choose Cash on Service or configure Razorpay credentials.'
      });
    }

    // Call Razorpay Orders API
    try {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${bookingCode || Date.now()}`,
          notes: {
            bookingCode: bookingCode || 'NEW',
            customerName: customerName || '',
            customerPhone: customerPhone || ''
          }
        })
      });

      if (!rzpRes.ok) {
        const errData = await rzpRes.json().catch(() => ({}));
        return res.status(400).json({
          success: false,
          message: errData.error?.description || 'Razorpay order creation failed. Please choose Cash on Service or try again.'
        });
      }

      const rzpOrder = await rzpRes.json();
      return res.status(200).json({
        success: true,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: 'INR',
        keyId
      });
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Unable to communicate with payment gateway. Please choose Cash on Service.'
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Verify Payment Signature and Mark Booking as Paid
 * POST /api/v1/payments/verify
 */
export async function verifyPayment(req, res, next) {
  try {
    const {
      bookingCode,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method = 'upi'
    } = req.body;

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        message: 'Booking code is required to verify payment.'
      });
    }

    const booking = await Booking.findOne({ bookingCode: String(bookingCode).trim() });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking #${bookingCode} not found.`
      });
    }

    if (!isAuthorizedForBooking(booking, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to verify payment for this reservation.'
      });
    }

    const settings = await Settings.findOne().select('+razorpayKeySecret');
    const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    // Verify cryptographic signature with Razorpay secret
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Payment secret is not configured on the server.'
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay verification credentials.'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
    const signatureBuffer = Buffer.from(String(razorpay_signature).trim(), 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Update booking record
    booking.paymentMode = 'online_before';
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.paymentDetails = {
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      provider: settings?.paymentGatewayProvider || 'razorpay',
      paidAt: new Date(),
      amount: booking.totals?.total || booking.total || 0,
      method: method || 'online',
      receipt: `rcpt_${bookingCode}`
    };

    const finalAmount = booking.totals?.total || booking.total || 0;
    booking.statusHistory.push({
      status: 'confirmed',
      note: `Payment of ₹${finalAmount.toLocaleString('en-IN')} received online via ${method.toUpperCase()} (Txn #${booking.paymentDetails.transactionId})`,
      timestamp: new Date()
    });

    await booking.save();

    // Trigger confirmation emails with payment receipt details
    try {
      await sendBookingConfirmationEmail(booking);
      await sendAdminNewBookingNotification(booking);
    } catch (e) {
      console.warn('Post-payment notification email notice:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and reservation confirmed!',
      booking
    });
  } catch (err) {
    next(err);
  }
}
