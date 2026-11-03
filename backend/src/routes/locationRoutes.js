import express from 'express';
import { getCities, detectCoverage, getDrivingRoute, autocompleteLocations, reverseGeocode, geocodeAddress } from '../controllers/locationController.js';

import { requireLiveTracking } from '../middleware/liveTracking.js';

const router = express.Router();

router.get('/cities', getCities);
router.get('/autocomplete', autocompleteLocations);
router.get('/geocode', geocodeAddress);
router.get('/reverse', reverseGeocode);
router.post('/detect', detectCoverage);
router.get('/route', requireLiveTracking, getDrivingRoute);

export default router;


