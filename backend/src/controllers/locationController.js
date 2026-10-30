import City from '../models/City.js';
import { resolveLocation, searchAndPrioritizeAddresses, reverseGeocodeLocation } from '../services/location/locationService.js';

/**
 * Reverse geocode GPS coordinates to street/area/landmark, city, and pincode
 * GET /api/v1/locations/reverse?lat=...&lng=...
 */
export async function reverseGeocode(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const result = await reverseGeocodeLocation({ lat, lng });
    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Valid lat and lng query parameters are required.'
      });
    }
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Search and prioritize autocomplete addresses (MongoDB Cities -> Uttar Pradesh -> India)
 * GET /api/v1/locations/autocomplete?q=...&lat=...&lng=...&city=...
 */
export async function autocompleteLocations(req, res, next) {
  try {
    const { q, lat, lng, city } = req.query;
    const parsedLat = lat !== undefined && lat !== '' ? parseFloat(lat) : null;
    const parsedLng = lng !== undefined && lng !== '' ? parseFloat(lng) : null;

    const predictions = await searchAndPrioritizeAddresses({
      query: q || '',
      lat: !isNaN(parsedLat) ? parsedLat : null,
      lng: !isNaN(parsedLng) ? parsedLng : null,
      city: city || ''
    });

    res.status(200).json({
      success: true,
      count: predictions.length,
      predictions
    });
  } catch (err) {
    next(err);
  }
}

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

// In-memory cache for road route geometries (2-minute TTL)
const routeCache = new Map();

/**
 * Get turn-by-turn road driving route coordinates
 * GET /api/v1/locations/route?startLat=...&startLng=...&endLat=...&endLng=...
 */
export async function getDrivingRoute(req, res, next) {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;

    const sLat = parseFloat(startLat);
    const sLng = parseFloat(startLng);
    const eLat = parseFloat(endLat);
    const eLng = parseFloat(endLng);

    if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid startLat, startLng, endLat, and endLng query parameters are required.'
      });
    }

    // Cache key rounded to ~10 meters (4 decimals)
    const cacheKey = `${sLat.toFixed(4)},${sLng.toFixed(4)}_${eLat.toFixed(4)},${eLng.toFixed(4)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
      return res.status(200).json(cached.data);
    }

    // Resilient road routing endpoints (OSRM and OpenStreetMap road engines)
    const osrmEndpoints = [
      `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`
    ];

    for (const url of osrmEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const upstream = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (upstream.ok) {
          const json = await upstream.json();
          if (json.code === 'Ok' && json.routes?.[0]?.geometry?.coordinates?.length) {
            const coordinates = json.routes[0].geometry.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0]
            }));

            const distanceMeters = json.routes[0].distance || 0;
            const durationSeconds = json.routes[0].duration || 0;

            const responsePayload = {
              success: true,
              coordinates,
              distanceKm: Number((distanceMeters / 1000).toFixed(1)),
              durationMinutes: Math.max(1, Math.round(durationSeconds / 60))
            };

            routeCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
            return res.status(200).json(responsePayload);
          }
        }
      } catch (err) {
        // Continue to fallback endpoint
      }
    }

    return res.status(503).json({
      success: false,
      message: 'Road network route temporarily calculating. Please retry.'
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getCities,
  autocompleteLocations,
  reverseGeocode,
  detectCoverage,
  getDrivingRoute
};


