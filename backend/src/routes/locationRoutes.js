import express from 'express';
import { getCities, detectCoverage } from '../controllers/locationController.js';

const router = express.Router();

router.get('/cities', getCities);
router.post('/detect', detectCoverage);

export default router;


