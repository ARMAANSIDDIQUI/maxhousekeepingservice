import express from 'express';
import {
  getServices,
  getServiceBySlug,
  getCategories
} from '../controllers/serviceController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/services', getServices);
router.get('/services/:slug', optionalAuth, getServiceBySlug);
router.get('/categories', getCategories);

export default router;
