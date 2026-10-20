import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Route imports
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Security Headers (allow popups for Google Sign-In)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// Automatic database connection middleware for serverless runtimes
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.warn('[DB Connection Notice] Auto-connect attempt:', err.message);
    }
  }
  next();
});

// CORS Configuration (Strict in production, permissive in local dev)
const allowedOrigins = [
  'https://www.maxhousekeepingservice.com',
  'https://maxhousekeepingservice.com',
  'https://maxhousesingservice.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (origin && origin.endsWith('.vercel.app')) ||
      (origin && (origin.endsWith('maxhousekeepingservice.com') || origin.endsWith('maxhousesingservice.vercel.app'))) ||
      (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: Origin not allowed'));
    }
  },
  credentials: true
}));

// Body Parsers & Data Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize());
app.use(hpp());

// General API rate limiter (180 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' }
});

// Strict rate limiter for sensitive authentication & verification endpoints (25 req / 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Public contact & waitlist spam protection (10 req / 15 mins)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions from this IP. Please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/signup-otp', authLimiter);
app.use('/api/v1/auth/request-otp', authLimiter);
app.use('/api/v1/auth/verify-otp', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);
app.use('/api/v1/public/contact', contactLimiter);
app.use('/api/v1/public/waitlist', contactLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve extracted partner assets and generated media statically
const workspaceRoot = path.resolve(process.cwd(), '..');
app.use('/media', express.static(path.join(workspaceRoot, 'docs', 'generated-media')));
app.use('/assets', express.static(path.join(workspaceRoot, 'docs', 'extracted', 'assets')));
// Also fallback to local docs if running from workspace root
app.use('/media', express.static(path.join(process.cwd(), 'docs', 'generated-media')));
app.use('/assets', express.static(path.join(process.cwd(), 'docs', 'extracted', 'assets')));

// Health Check & Root API Status
app.get(['/api', '/api/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Max Housekeeping API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
