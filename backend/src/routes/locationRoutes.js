import express from 'express';
import { getCities, detectCoverage, getDrivingRoute, autocompleteLocations } from '../controllers/locationController.js';

const router = express.Router();

router.get('/cities', getCities);
router.get('/autocomplete', autocompleteLocations);
router.post('/detect', detectCoverage);
router.get('/route', getDrivingRoute);

export default router;


