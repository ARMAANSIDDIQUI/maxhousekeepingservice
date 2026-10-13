import City from '../../models/City.js';

// Haversine distance calculator in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolves a customer's location against serviceable cities
 * Checks pincode first, then Geo coordinates
 */
export async function resolveLocation({ pincode, lat, lng }) {
  // 1. Try resolving by 6-digit Pincode
  if (pincode) {
    const cleanPincode = String(pincode).trim();
    const cityByPincode = await City.findOne({
      pincodes: cleanPincode,
      status: 'active'
    });

    if (cityByPincode) {
      return {
        isServiced: true,
        matchedBy: 'pincode',
        city: cityByPincode,
        message: `Service available in ${cityByPincode.name}`
      };
    }
  }

  // 2. Try resolving by GPS coordinates [lng, lat]
  if (typeof lat === 'number' && typeof lng === 'number') {
    // Attempt GeoJSON 2dsphere near query
    try {
      const nearbyCities = await City.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            spherical: true,
            query: { status: 'active' }
          }
        },
        { $limit: 1 }
      ]);

      if (nearbyCities.length > 0) {
        const nearest = nearbyCities[0];
        const distanceKm = Math.round((nearest.distanceMeters / 1000) * 10) / 10;
        const radius = nearest.serviceRadiusKm || 25;

        if (distanceKm <= radius) {
          return {
            isServiced: true,
            matchedBy: 'coordinates',
            city: nearest,
            distanceKm,
            message: `Service available in ${nearest.name} (~${distanceKm} km away)`
          };
        } else {
          return {
            isServiced: false,
            nearestCity: nearest,
            distanceKm,
            message: `Currently beyond our active radius (${distanceKm} km from ${nearest.name}). We are expanding soon!`
          };
        }
      }
    } catch {
      // Fallback in-memory distance calculation if geo index isn't ready
      const allActive = await City.find({ status: 'active' });
      let closest = null;
      let minDistance = Infinity;

      for (const city of allActive) {
        if (city.location?.coordinates?.length === 2) {
          const [cLng, cLat] = city.location.coordinates;
          const dist = calculateDistanceKm(lat, lng, cLat, cLng);
          if (dist < minDistance) {
            minDistance = dist;
            closest = city;
          }
        }
      }

      if (closest && minDistance <= (closest.serviceRadiusKm || 25)) {
        return {
          isServiced: true,
          matchedBy: 'coordinates_fallback',
          city: closest,
          distanceKm: minDistance,
          message: `Service available in ${closest.name}`
        };
      } else if (closest) {
        return {
          isServiced: false,
          nearestCity: closest,
          distanceKm: minDistance,
          message: `Currently beyond our active radius (${minDistance} km from ${closest.name}).`
        };
      }
    }
  }

  return {
    isServiced: false,
    message: 'Location could not be matched with our active coverage zones in Western Uttar Pradesh.'
  };
}

export default {
  calculateDistanceKm,
  resolveLocation
};
