import express from 'express';
import { getCities, detectCoverage, getDrivingRoute, autocompleteLocations, reverseGeocode } from '../controllers/locationController.js';

const router = express.Router();

router.get('/cities', getCities);
router.get('/autocomplete', autocompleteLocations);
router.get('/reverse', reverseGeocode);
router.post('/detect', detectCoverage);
router.get('/route', getDrivingRoute);

export default router;


