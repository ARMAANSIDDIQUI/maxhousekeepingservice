import express from 'express';
import {
  getBrands,
  getTestimonials,
  getPublicSettings,
  submitContact,
  joinWaitlist
} from '../controllers/publicController.js';
import { liveTrackingStream } from '../middleware/liveTracking.js';

const router = express.Router();

router.get('/live-tracking/stream', liveTrackingStream);

router.get('/brands', getBrands);
router.get('/testimonials', getTestimonials);
router.get('/settings', getPublicSettings);
router.post('/contact', submitContact);
router.post('/waitlist', joinWaitlist);

export default router;
