import City from '../../models/City.js';
import Settings from '../../models/Settings.js';

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

// Common phonetic / spelling variations in Indian & Uttar Pradesh addresses
const PHONETIC_REPLACEMENTS = [
  [/\bmolsiry\b/gi, 'Molsari'],
  [/\bmolsiri\b/gi, 'Molsari'],
  [/\bmaulsiry\b/gi, 'Maulsari'],
  [/\bmoulsari\b/gi, 'Molsari'],
  [/\bmaszid\b/gi, 'Masjid'],
  [/\bmashjid\b/gi, 'Masjid'],
  [/\bchoraha\b/gi, 'Chauraha'],
  [/\bchouraha\b/gi, 'Chauraha'],
  [/\bchawk\b/gi, 'Chowk'],
  [/\bcoloni\b/gi, 'Colony'],
  [/\bmuradabad\b/gi, 'Moradabad'],
  [/\bgajrola\b/gi, 'Gajraula'],
  [/\bchandosi\b/gi, 'Chandausi']
];

/**
 * Generates phonetic and local-context query variants so landmarks like
 * "molsiry masjid" match "Molsari Masjid" / "Maulsari Masjid" reliably.
 */
export function expandIndianQueryVariants(rawQuery, activeCity = '') {
  const clean = String(rawQuery || '').trim();
  if (!clean) return [];

  const variants = new Set([clean]);

  // Apply phonetic normalizations
  let normalized = clean;
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  if (normalized !== clean) {
    variants.add(normalized);
  }

  // Specific vowel/transliteration swaps common in Hindi/Urdu -> English
  if (/molsir[iy]/i.test(clean)) {
    variants.add(clean.replace(/molsir[iy]/gi, 'Molsari'));
    variants.add(clean.replace(/molsir[iy]/gi, 'Maulsari'));
  } else if (/molsari/i.test(clean)) {
    variants.add(clean.replace(/molsari/gi, 'Maulsari'));
  }

  // If query mentions masjid/mosque, ensure both are tried if needed
  const baseList = Array.from(variants);
  const cityClean = String(activeCity || '').trim();

  if (cityClean && !clean.toLowerCase().includes(cityClean.toLowerCase())) {
    variants.add(`${ baseList[0] }, ${ cityClean }, Uttar Pradesh`);
    if (baseList[1]) {
      variants.add(`${ baseList[1] }, ${ cityClean }, Uttar Pradesh`);
    }
  } else if (!/uttar pradesh|\bup\b/i.test(clean)) {
    variants.add(`${ baseList[0] }, Uttar Pradesh`);
  }

  return Array.from(variants);
}

// Curated high-priority landmarks & localities in our MongoDB cities (Moradabad, Rampur, Amroha, etc.)
export const UP_CITY_LANDMARKS = [
  { name: 'Molsari Masjid (Maulsari Masjid)', area: 'Mughal Pura / Lal Bagh', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8398, lng: 78.7822, keywords: ['molsiry masjid', 'molsari masjid', 'maulsari masjid', 'molsiri masjid', 'masjid moradabad'] },
  { name: 'Jama Masjid Moradabad', area: 'Jama Masjid Chowk', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8344, lng: 78.7905, keywords: ['jama masjid', 'shahi jama masjid', 'masjid'] },
  { name: 'Civil Lines', area: 'Civil Lines', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8465, lng: 78.7652, keywords: ['civil lines', 'collectorate', 'pili kothi'] },
  { name: 'MDA Colony / New Moradabad', area: 'Kanth Road / Delhi Road', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8624, lng: 78.7289, keywords: ['mda colony', 'new moradabad', 'ram ganga vihar', 'ashiyana'] },
  { name: 'Ram Ganga Vihar Phase 1 & 2', area: 'Kanth Road', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8672, lng: 78.7544, keywords: ['ram ganga vihar', 'tdi city', 'wave mall'] },
  { name: 'Budh Bazaar / Station Road', area: 'Budh Bazaar', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8351, lng: 78.7718, keywords: ['budh bazaar', 'station road', 'railway station', 'imperial tiraha'] },
  { name: 'Majhola / Line Par', area: 'Delhi Road, Majhola', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244103', lat: 28.8211, lng: 78.7421, keywords: ['majhola', 'line par', 'kashiram nagar', 'pakbara'] },
  { name: 'Kanth Road / Harthala', area: 'Kanth Road', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8795, lng: 78.7465, keywords: ['kanth road', 'harthala', 'vivekanand hospital', 'mit'] },
  { name: 'Karula / Sambhal Road', area: 'Karula', city: 'Moradabad', state: 'Uttar Pradesh', pincode: '244001', lat: 28.8124, lng: 78.7798, keywords: ['karula', 'sambhal road', 'katghar', 'galshaheed'] },
  { name: 'Raza Library / Civil Lines', area: 'Hamid Manzil', city: 'Rampur', state: 'Uttar Pradesh', pincode: '244901', lat: 28.8035, lng: 79.0265, keywords: ['rampur', 'raza library', 'jama masjid rampur', 'civil lines rampur'] },
  { name: 'Vasudev Tirth / Joya Road', area: 'Amroha Town', city: 'Amroha', state: 'Uttar Pradesh', pincode: '244221', lat: 28.9044, lng: 78.4673, keywords: ['amroha', 'joya road', 'shah vilayat'] },
  { name: 'Chopla / NH-9 Industrial Area', area: 'Gajraula', city: 'Gajraula', state: 'Uttar Pradesh', pincode: '244235', lat: 28.8456, lng: 78.2393, keywords: ['gajraula', 'chopla', 'jubliant'] }
];

/**
 * Scores and sorts an address candidate by:
 * 1. MongoDB Saved Cities priority (using City.rankingScore from MongoDB)
 * 2. Uttar Pradesh state priority (UP state name or UP pincode 20xxxx-28xxxx)
 * 3. India country priority
 * 4. Distance to active reference coordinates
 */
export function computeAddressPriorityScore(item, mongoCities = [], activeCityName = '', refLat = null, refLng = null) {
  const fullText = `${item.mainText || ''} ${item.secondaryText || ''} ${item.description || ''} ${item.city || ''} ${item.state || ''}`.toLowerCase();
  let score = 0;
  let matchedMongoCity = null;

  // Check if item matches any saved MongoDB city
  for (const city of mongoCities) {
    const cName = String(city.name || '').toLowerCase();
    if (!cName) continue;
    const hasCityName = fullText.includes(cName);
    const hasCityPincode = Array.isArray(city.pincodes) && item.pincode && city.pincodes.includes(String(item.pincode).trim());
    let withinCityRadius = false;
    if (typeof item.lat === 'number' && typeof item.lng === 'number' && city.location?.coordinates?.length === 2) {
      const [cLng, cLat] = city.location.coordinates;
      const distKm = calculateDistanceKm(item.lat, item.lng, cLat, cLng);
      if (distKm <= (city.serviceRadiusKm || 25)) {
        withinCityRadius = true;
      }
    }

    if (hasCityName || hasCityPincode || withinCityRadius) {
      matchedMongoCity = city;
      break;
    }
  }

  // Tier 1: Saved MongoDB City boost (5000 + city.rankingScore)
  if (matchedMongoCity) {
    score += 5000 + (matchedMongoCity.rankingScore || 500);
    if (activeCityName && matchedMongoCity.name.toLowerCase() === String(activeCityName).toLowerCase()) {
      score += 1500; // Extra boost for user's currently selected city
    }
  }

  // Tier 2: Uttar Pradesh boost (+2500)
  const isUpState =
    /uttar pradesh|\bu\.?p\.?\b/i.test(fullText) ||
    (item.pincode && /^2[0-8]\d{4}$/.test(String(item.pincode).trim())) ||
    Boolean(matchedMongoCity && /uttar pradesh/i.test(matchedMongoCity.state || 'Uttar Pradesh'));

  if (isUpState) {
    score += 2500;
  }

  // Tier 3: India boost (+1000)
  const isIndia = /india|bharat/i.test(fullText) || isUpState || Boolean(matchedMongoCity);
  if (isIndia) {
    score += 1000;
  }

  // Distance proximity bonus (up to +800 points for close results)
  let distanceMeters = item.distance_meters ?? null;
  if (typeof item.lat === 'number' && typeof item.lng === 'number' && typeof refLat === 'number' && typeof refLng === 'number') {
    const distKm = calculateDistanceKm(item.lat, item.lng, refLat, refLng);
    distanceMeters = Math.round(distKm * 1000);
    score += Math.max(0, 800 - Math.min(800, distKm * 12));
  }

  return {
    score,
    isMongoCity: Boolean(matchedMongoCity),
    mongoCityName: matchedMongoCity?.name || item.city || '',
    mongoCityPincode: matchedMongoCity?.pincodes?.[0] || '',
    isUttarPradesh: isUpState,
    isIndia,
    distance_meters: distanceMeters
  };
}

/**
 * Multi-source autocomplete & landmark search with MongoDB City + UP + India priority
 */
export async function searchAndPrioritizeAddresses({ query, lat, lng, city: activeCityName }) {
  const rawQuery = String(query || '').trim();
  if (rawQuery.length < 2) {
    return [];
  }

  // 1. Load saved cities from MongoDB sorted by rankingScore
  const mongoCities = await City.find({ status: { $ne: 'inactive' } })
    .sort({ rankingScore: -1, sortOrder: 1, name: 1 })
    .lean();

  // Determine reference coordinates (from query params, active MongoDB city, or Moradabad default)
  const activeCityDoc = mongoCities.find(
    (c) => activeCityName && c.name.toLowerCase() === String(activeCityName).toLowerCase()
  ) || mongoCities[0];

  const refLat = typeof lat === 'number' && !isNaN(lat)
    ? lat
    : (activeCityDoc?.location?.coordinates?.[1] ?? 28.8386);
  const refLng = typeof lng === 'number' && !isNaN(lng)
    ? lng
    : (activeCityDoc?.location?.coordinates?.[0] ?? 78.7733);

  const qLower = rawQuery.toLowerCase();
  const candidates = [];

  // 2. Match curated local UP landmarks & mosques (e.g. Molsari Masjid / Molsiry Masjid)
  for (const lm of UP_CITY_LANDMARKS) {
    const hay = `${lm.name} ${lm.area} ${lm.city} ${lm.keywords.join(' ')}`.toLowerCase();
    const tokens = qLower.split(/\s+/).filter(Boolean);
    const allMatch = tokens.every((t) => {
      if (hay.includes(t)) return true;
      // Handle molsiry / molsiri / maulsari fuzzy match
      if (/^m[ao]u?ls[ia]?r[iy]$/i.test(t) && hay.includes('molsari')) return true;
      if (/^mas[jz]id$/i.test(t) && hay.includes('masjid')) return true;
      return false;
    });

    if (allMatch) {
      candidates.push({
        place_id: `up_lm_${lm.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        description: `${lm.name}, ${lm.area}, ${lm.city}, ${lm.state} ${lm.pincode}, India`,
        mainText: lm.name,
        secondaryText: `${lm.area}, ${lm.city}, ${lm.state}`,
        city: lm.city,
        state: lm.state,
        pincode: lm.pincode,
        lat: lm.lat,
        lng: lm.lng,
        source: 'local_verified'
      });
    }
  }

  // 3. Match saved MongoDB cities directly if query matches city name, tag, or pincode
  for (const c of mongoCities) {
    const cityHay = `${c.name} ${c.state || 'Uttar Pradesh'} ${(c.pincodes || []).join(' ')} ${(c.tags || []).join(' ')}`.toLowerCase();
    if (cityHay.includes(qLower)) {
      const [cLng, cLat] = c.location?.coordinates?.length === 2 ? c.location.coordinates : [78.7733, 28.8386];
      candidates.push({
        place_id: `mongo_city_${c.slug || c._id}`,
        description: `${c.name}, ${c.state || 'Uttar Pradesh'}${c.pincodes?.[0] ? ' ' + c.pincodes[0] : ''}, India`,
        mainText: c.name,
        secondaryText: `${c.state || 'Uttar Pradesh'} • Active Service City`,
        city: c.name,
        state: c.state || 'Uttar Pradesh',
        pincode: c.pincodes?.[0] || '',
        lat: cLat,
        lng: cLng,
        source: 'mongodb_city'
      });
    }
  }

  const queryVariants = expandIndianQueryVariants(rawQuery, activeCityDoc?.name || activeCityName || 'Moradabad');

  // 4. Optional Backend Google Maps Places Text Search (if API key configured)
  let googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!googleApiKey) {
    try {
      const settings = await Settings.getSingleton();
      googleApiKey = settings?.integrations?.googleMapsApiKey || '';
    } catch {
      // ignore
    }
  }

  const fetchPromises = [];

  if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    const gQuery = encodeURIComponent(queryVariants[0]);
    const gUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${gQuery}&location=${refLat},${refLng}&radius=35000&region=in&key=${googleApiKey}`;
    fetchPromises.push(
      fetch(gUrl, { signal: AbortSignal.timeout(3500) })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (Array.isArray(data?.results)) {
            for (const item of data.results.slice(0, 6)) {
              const pMatch = (item.formatted_address || '').match(/\b([1-9][0-9]{5})\b/);
              candidates.push({
                place_id: item.place_id || `gtext_${Math.random()}`,
                description: item.formatted_address ? `${item.name}, ${item.formatted_address}` : item.name,
                mainText: item.name,
                secondaryText: item.formatted_address || 'Uttar Pradesh, India',
                pincode: pMatch ? pMatch[1] : '',
                lat: item.geometry?.location?.lat,
                lng: item.geometry?.location?.lng,
                source: 'google_textsearch'
              });
            }
          }
        })
        .catch(() => {})
    );
  }

  // 5. OpenStreetMap Nominatim (India filter + UP viewbox priority)
  for (const variant of queryVariants.slice(0, 2)) {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&viewbox=77.0,29.6,80.5,27.5&bounded=0&q=${encodeURIComponent(variant)}`;
    fetchPromises.push(
      fetch(nomUrl, {
        headers: { 'User-Agent': 'MaxHousekeepingApp/1.0 (https://maxhousekeeping.in)' },
        signal: AbortSignal.timeout(3500)
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((rows) => {
          if (Array.isArray(rows)) {
            for (const r of rows) {
              const addr = r.address || {};
              const mainText = r.name || addr.amenity || addr.Road || addr.suburb || (r.display_name || '').split(',')[0];
              const city = addr.city || addr.town || addr.county || addr.state_district || '';
              const state = addr.state || '';
              const pincode = addr.postcode || '';
              candidates.push({
                place_id: `nom_${r.place_id}`,
                description: r.display_name,
                mainText,
                secondaryText: [addr.suburb || addr.neighbourhood, city, state, pincode].filter(Boolean).join(', '),
                city,
                state,
                pincode,
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
                source: 'nominatim'
              });
            }
          }
        })
        .catch(() => {})
    );
  }

  // 6. Photon Komoot Geocoder (biased to active UP city coordinates)
  for (const variant of queryVariants.slice(0, 2)) {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(variant)}&lat=${refLat}&lon=${refLng}&limit=6`;
    fetchPromises.push(
      fetch(photonUrl, { signal: AbortSignal.timeout(3500) })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (Array.isArray(data?.features)) {
            for (const f of data.features) {
              const p = f.properties || {};
              const country = (p.country || '').toLowerCase();
              if (country && country !== 'india' && p.countrycode !== 'IN') continue;
              const [fLng, fLat] = f.geometry?.coordinates || [];
              const mainText = p.name || p.street || p.locality || p.city || 'Location';
              const city = p.city || p.county || p.district || '';
              const state = p.state || '';
              const pincode = p.postcode || '';
              const secondaryParts = [p.street, p.locality || p.district, city, state, pincode].filter(
                (x, idx, arr) => x && x !== mainText && arr.indexOf(x) === idx
              );
              candidates.push({
                place_id: `photon_${p.osm_id || Math.random()}`,
                description: [mainText, ...secondaryParts, 'India'].filter(Boolean).join(', '),
                mainText,
                secondaryText: secondaryParts.join(', ') || 'Uttar Pradesh, India',
                city,
                state,
                pincode,
                lat: fLat,
                lng: fLng,
                source: 'photon'
              });
            }
          }
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(fetchPromises);

  // 7. Score, deduplicate, and sort candidates (MongoDB Cities -> Uttar Pradesh -> India)
  const seenKeys = new Set();
  const scoredResults = [];

  for (const item of candidates) {
    const dedupKey = `${String(item.mainText || '').toLowerCase().trim()}|${String(item.city || '').toLowerCase().trim()}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    const priority = computeAddressPriorityScore(item, mongoCities, activeCityDoc?.name || activeCityName, refLat, refLng);
    if (!priority.isIndia) continue; // Keep only Indian addresses

    const resolvedCity = priority.mongoCityName || item.city || activeCityDoc?.name || '';
    const resolvedPincode = item.pincode || priority.mongoCityPincode || '';

    scoredResults.push({
      place_id: item.place_id,
      description: item.description,
      structured_formatting: {
        main_text: item.mainText,
        secondary_text: item.secondaryText
      },
      city: resolvedCity,
      state: priority.isUttarPradesh ? 'Uttar Pradesh' : (item.state || 'India'),
      pincode: resolvedPincode,
      lat: item.lat,
      lng: item.lng,
      distance_meters: priority.distance_meters,
      isMongoCity: priority.isMongoCity,
      isUttarPradesh: priority.isUttarPradesh,
      priorityScore: priority.score,
      source: item.source
    });
  }

  scoredResults.sort((a, b) => b.priorityScore - a.priorityScore);
  return scoredResults.slice(0, 10);
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
  resolveLocation,
  expandIndianQueryVariants,
  computeAddressPriorityScore,
  searchAndPrioritizeAddresses
};
