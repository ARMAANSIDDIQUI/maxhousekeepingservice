/**
 * Geo Utilities: Haversine distance & Uber/Rapido-style ETA calculations
 * Zero Google API charges - 100% computed client-side in the browser.
 */

/**
 * Calculates straight-line distance in kilometers (Haversine formula).
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) * Math.cos(nLat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Returns formatted distance and estimated arrival time like Uber / Rapido.
 * Uses realistic city transit speed (~22 km/h).
 */
export function getEtaInfo(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm) || distanceKm < 0) return null;

  if (distanceKm <= 0.08) {
    return {
      distanceText: 'At Doorstep',
      etaText: 'Arrived',
      badgeText: 'Arrived at Doorstep',
      statusText: 'Supervisor has reached your building / gate',
      isArrived: true
    };
  }

  // City travel speed (~22 km/h average in Indian cities)
  const mins = Math.max(2, Math.round((distanceKm / 22) * 60));

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return {
      distanceText: `${meters}m away`,
      etaText: `~${mins} min${mins > 1 ? 's' : ''}`,
      badgeText: `${meters}m away • ~${mins} min`,
      statusText: 'Approaching your street',
      isArrived: false
    };
  }

  return {
    distanceText: `${distanceKm.toFixed(1)} km away`,
    etaText: `~${mins} min${mins > 1 ? 's' : ''}`,
    badgeText: `${distanceKm.toFixed(1)} km away • ~${mins} mins`,
    statusText: 'Supervisor on the way',
    isArrived: false
  };
}

export default {
  calculateDistanceKm,
  getEtaInfo
};
