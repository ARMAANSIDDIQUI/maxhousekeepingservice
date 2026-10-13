import express from 'express';
import {
  getBrands,
  getTestimonials,
  getPublicSettings,
  submitContact,
  joinWaitlist
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/brands', getBrands);
router.get('/testimonials', getTestimonials);
router.get('/settings', getPublicSettings);
router.post('/contact', submitContact);
router.post('/waitlist', joinWaitlist);

export default router;
