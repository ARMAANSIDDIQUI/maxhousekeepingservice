import City from '../models/City.js';
import { resolveLocation } from '../services/location/locationService.js';

/**
 * Get all active serviceable cities
 * GET /api/v1/locations/cities
 */
export async function getCities(req, res, next) {
  try {
    const cities = await City.find({ status: { $ne: 'inactive' } })
      .sort({ rankingScore: -1, sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: cities.length,
      cities
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Detect coverage zone by coordinates or pincode
 * POST /api/v1/locations/detect
 */
export async function detectCoverage(req, res, next) {
  try {
    const { pincode, lat, lng } = req.body;

    const result = await resolveLocation({
      pincode: pincode ? String(pincode).trim() : null,
      lat: typeof lat === 'number' ? lat : (lat ? parseFloat(lat) : null),
      lng: typeof lng === 'number' ? lng : (lng ? parseFloat(lng) : null)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getCities,
  detectCoverage
};
