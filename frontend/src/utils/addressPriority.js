import { calculateDistanceKm } from './geoUtils';

/**
 * Empty initial array — all serviceable cities are fetched dynamically from MongoDB (/api/v1/locations/cities)
 */
export const DEFAULT_MONGO_UP_CITIES = [];

/**
 * Returns the exact raw query without altering or hardcoding place names.
 */
export function expandIndianSearchQueries(rawInput) {
  const clean = String(rawInput || '').trim();
  return clean ? [clean] : [];
}

/**
 * No hardcoded places/landmarks — returns empty array so real Google Places API results are used directly.
 */
export function matchLocalUpAndMongoCandidates() {
  return [];
}

/**
 * Prioritizes, deduplicates, and sorts live Google Places / API address predictions
 * against the saved cities fetched from MongoDB:
 *   Tier 1 (Highest): Saved MongoDB Cities (weighted by city.rankingScore & activeCity match)
 *   Tier 2: Uttar Pradesh addresses
 *   Tier 3: Other Google Places predictions
 */
export function prioritizeIndianUpPredictions(
  rawPredictions = [],
  mongoCities = [],
  activeCityName = '',
  refCoords = null
) {
  const cities = Array.isArray(mongoCities) ? mongoCities : [];
  const seenKeys = new Set();
  const scored = [];

  for (const pred of rawPredictions) {
    if (!pred) continue;
    const mainText = pred.structured_formatting?.main_text || pred.mainText || (pred.description || '').split(',')[0] || '';
    const secondaryText = pred.structured_formatting?.secondary_text || pred.secondaryText || (pred.description || '').split(',').slice(1).join(',').trim() || '';
    const fullText = `${mainText} ${secondaryText} ${pred.description || ''} ${pred.city || ''} ${pred.state || ''}`.toLowerCase();

    const dedupKey = pred.place_id || `${mainText.toLowerCase().trim()}|${secondaryText.toLowerCase().trim()}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    let score = typeof pred.priorityScore === 'number' ? pred.priorityScore : 0;
    let matchedCity = null;

    for (const c of cities) {
      const cNameLower = String(c.name || '').toLowerCase();
      if (!cNameLower) continue;
      const nameMatched = fullText.includes(cNameLower);
      const pinMatched = Array.isArray(c.pincodes) && pred.pincode && c.pincodes.includes(String(pred.pincode).trim());
      let coordMatched = false;
      if (typeof pred.lat === 'number' && typeof pred.lng === 'number' && c.location?.coordinates?.length === 2) {
        const [cLng, cLat] = c.location.coordinates;
        if (calculateDistanceKm(pred.lat, pred.lng, cLat, cLng) <= (c.serviceRadiusKm || 25)) {
          coordMatched = true;
        }
      }
      if (nameMatched || pinMatched || coordMatched) {
        matchedCity = c;
        break;
      }
    }

    const isUp =
      Boolean(pred.isUttarPradesh) ||
      /uttar pradesh|\bu\.?p\.?\b/i.test(fullText) ||
      Boolean(matchedCity && /uttar pradesh/i.test(matchedCity.state || 'Uttar Pradesh')) ||
      /\b2[0-8]\d{4}\b/.test(fullText);

    const isIndia =
      isUp ||
      Boolean(matchedCity) ||
      /india|bharat|delhi|uttarakhand|haryana|punjab|bihar|rajasthan|madhya pradesh|maharashtra/i.test(fullText);

    if (!score) {
      // Boost native Google Places predictions so Google Places results always lead
      if (pred.source !== 'nominatim' && pred.source !== 'photon') {
        score += 3000;
      }
      if (matchedCity) {
        score += 5000 + (matchedCity.rankingScore || 500);
        if (activeCityName && matchedCity.name.toLowerCase() === String(activeCityName).toLowerCase()) {
          score += 1500;
        }
      }
      if (isUp) score += 2500;
      if (isIndia) score += 1000;
    }

    let distMeters = typeof pred.distance_meters === 'number' ? pred.distance_meters : null;
    if (distMeters === null && typeof pred.lat === 'number' && typeof pred.lng === 'number' && refCoords && typeof refCoords.lat === 'number' && typeof refCoords.lng === 'number') {
      distMeters = Math.round(calculateDistanceKm(refCoords.lat, refCoords.lng, pred.lat, pred.lng) * 1000);
    }

    if (typeof distMeters === 'number') {
      const distKm = distMeters / 1000;
      score += Math.max(0, 800 - Math.min(800, distKm * 12));
    }

    const pinFromText = (fullText.match(/\b([1-9][0-9]{5})\b/) || [])[1] || '';
    const resolvedPincode = pred.pincode || pinFromText || matchedCity?.pincodes?.[0] || '';
    const resolvedCity = pred.city || matchedCity?.name || '';

    scored.push({
      ...pred,
      structured_formatting: {
        main_text: mainText,
        secondary_text: secondaryText
      },
      city: resolvedCity,
      state: isUp ? 'Uttar Pradesh' : (pred.state || ''),
      pincode: resolvedPincode,
      distance_meters: distMeters,
      isMongoCity: Boolean(matchedCity),
      mongoCityName: matchedCity?.name || resolvedCity,
      isUttarPradesh: isUp,
      priorityScore: score
    });
  }

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored.slice(0, 8);
}

/**
 * Helper to look up default pincode from the MongoDB saved cities list
 */
export function getDefaultPincodeForCity(cityName, mongoCities = []) {
  if (!cityName || !Array.isArray(mongoCities)) return '';
  const found = mongoCities.find((c) => String(c.name || '').toLowerCase() === String(cityName).trim().toLowerCase());
  return found?.pincodes?.[0] || '';
}
