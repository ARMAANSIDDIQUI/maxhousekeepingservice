import express from 'express';
import { getCities, detectCoverage, getDrivingRoute } from '../controllers/locationController.js';

const router = express.Router();

router.get('/cities', getCities);
router.post('/detect', detectCoverage);
router.get('/route', getDrivingRoute);

export default router;


