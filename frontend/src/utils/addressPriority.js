import { calculateDistanceKm } from './geoUtils';

/**
 * Default Saved MongoDB Cities fallback (used before /api/v1/locations/cities finishes loading)
 */
export const DEFAULT_MONGO_UP_CITIES = [
  { name: 'Moradabad', state: 'Uttar Pradesh', rankingScore: 1000, pincodes: ['244001', '244102', '244103', '244104'], location: { coordinates: [78.7733, 28.8386] }, serviceRadiusKm: 30 },
  { name: 'Rampur', state: 'Uttar Pradesh', rankingScore: 920, pincodes: ['244901'], location: { coordinates: [79.0250, 28.7983] }, serviceRadiusKm: 25 },
  { name: 'Amroha', state: 'Uttar Pradesh', rankingScore: 900, pincodes: ['244221'], location: { coordinates: [78.4673, 28.9044] }, serviceRadiusKm: 25 },
  { name: 'Sambhal', state: 'Uttar Pradesh', rankingScore: 880, pincodes: ['244302'], location: { coordinates: [78.5703, 28.5854] }, serviceRadiusKm: 25 },
  { name: 'Chandausi', state: 'Uttar Pradesh', rankingScore: 860, pincodes: ['244412'], location: { coordinates: [78.7796, 28.4526] }, serviceRadiusKm: 25 },
  { name: 'Gajraula', state: 'Uttar Pradesh', rankingScore: 850, pincodes: ['244235'], location: { coordinates: [78.2393, 28.8456] }, serviceRadiusKm: 25 },
  { name: 'Bijnor', state: 'Uttar Pradesh', rankingScore: 830, pincodes: ['246701'], location: { coordinates: [78.1342, 29.3724] }, serviceRadiusKm: 25 },
  { name: 'Dhampur', state: 'Uttar Pradesh', rankingScore: 820, pincodes: ['246761'], location: { coordinates: [78.5085, 29.3090] }, serviceRadiusKm: 25 },
  { name: 'Noorpur', state: 'Uttar Pradesh', rankingScore: 810, pincodes: ['246734'], location: { coordinates: [78.4098, 29.1504] }, serviceRadiusKm: 25 },
  { name: 'Hassanpur', state: 'Uttar Pradesh', rankingScore: 800, pincodes: ['244241'], location: { coordinates: [78.2839, 28.7244] }, serviceRadiusKm: 25 },
  { name: 'Kashipur', state: 'Uttarakhand', rankingScore: 760, pincodes: ['244713'], location: { coordinates: [78.9619, 29.2104] }, serviceRadiusKm: 25 }
];

/**
 * Curated landmarks & localities across our MongoDB UP cities for instant recall
 */
export const LOCAL_UP_LANDMARKS = [
  {
    place_id: 'up_lm_molsari_masjid_mbd',
    mainText: 'Molsari Masjid (Maulsari Masjid)',
    secondaryText: 'Mughal Pura, Lal Bagh, Moradabad, Uttar Pradesh 244001',
    description: 'Molsari Masjid (Maulsari Masjid), Mughal Pura, Lal Bagh, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8398,
    lng: 78.7822,
    keywords: ['molsiry', 'molsari', 'maulsari', 'molsiri', 'moulsari', 'masjid', 'mosque', 'mughal pura', 'lal bagh']
  },
  {
    place_id: 'up_lm_jama_masjid_mbd',
    mainText: 'Shahi Jama Masjid',
    secondaryText: 'Jama Masjid Chowk, Moradabad, Uttar Pradesh 244001',
    description: 'Shahi Jama Masjid, Jama Masjid Chowk, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8344,
    lng: 78.7905,
    keywords: ['jama masjid', 'shahi masjid', 'masjid', 'chowk']
  },
  {
    place_id: 'up_lm_civil_lines_mbd',
    mainText: 'Civil Lines',
    secondaryText: 'Pili Kothi / Collectorate Area, Moradabad, Uttar Pradesh 244001',
    description: 'Civil Lines, Pili Kothi, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8465,
    lng: 78.7652,
    keywords: ['civil lines', 'pili kothi', 'collectorate', 'company bagh']
  },
  {
    place_id: 'up_lm_ram_ganga_vihar_mbd',
    mainText: 'Ram Ganga Vihar (Phase 1 & 2)',
    secondaryText: 'Kanth Road, Near Wave Mall, Moradabad, Uttar Pradesh 244001',
    description: 'Ram Ganga Vihar, Kanth Road, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8672,
    lng: 78.7544,
    keywords: ['ram ganga vihar', 'tdi city', 'wave mall', 'ashiyana', 'mda']
  },
  {
    place_id: 'up_lm_new_moradabad_mda',
    mainText: 'New Moradabad (MDA Colony)',
    secondaryText: 'Delhi Road / Pakbara, Moradabad, Uttar Pradesh 244102',
    description: 'New Moradabad (MDA Colony), Delhi Road, Moradabad, Uttar Pradesh 244102, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244102',
    lat: 28.8624,
    lng: 78.7289,
    keywords: ['new moradabad', 'mda colony', 'sector', 'pakbara', 'tmU']
  },
  {
    place_id: 'up_lm_majhola_linepar',
    mainText: 'Majhola / Line Par',
    secondaryText: 'Delhi Road, Majhola, Moradabad, Uttar Pradesh 244103',
    description: 'Majhola, Line Par, Delhi Road, Moradabad, Uttar Pradesh 244103, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244103',
    lat: 28.8211,
    lng: 78.7421,
    keywords: ['majhola', 'line par', 'kashiram nagar', 'mansarovar colony', 'buddhi vihar']
  },
  {
    place_id: 'up_lm_budh_bazaar',
    mainText: 'Budh Bazaar & Station Road',
    secondaryText: 'Near Moradabad Railway Station, Moradabad, Uttar Pradesh 244001',
    description: 'Budh Bazaar, Station Road, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8351,
    lng: 78.7718,
    keywords: ['budh bazaar', 'station road', 'imperial tiraha', 'railway station']
  },
  {
    place_id: 'up_lm_kanth_road',
    mainText: 'Kanth Road / Harthala',
    secondaryText: 'Near Vivekanand Hospital & MIT, Moradabad, Uttar Pradesh 244001',
    description: 'Kanth Road, Harthala, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8795,
    lng: 78.7465,
    keywords: ['kanth road', 'harthala', 'vivekanand', 'mit', 'pac']
  },
  {
    place_id: 'up_lm_karula_katghar',
    mainText: 'Karula / Galshaheed / Katghar',
    secondaryText: 'Sambhal Road & Rampur Road, Moradabad, Uttar Pradesh 244001',
    description: 'Karula, Galshaheed, Moradabad, Uttar Pradesh 244001, India',
    city: 'Moradabad',
    state: 'Uttar Pradesh',
    pincode: '244001',
    lat: 28.8124,
    lng: 78.7798,
    keywords: ['karula', 'katghar', 'galshaheed', 'idgah', 'peergaib', 'mughalpura']
  }
];

const PHONETIC_MAP = [
  [/\bmolsiry\b/gi, 'Molsari'],
  [/\bmolsiri\b/gi, 'Molsari'],
  [/\bmaulsiry\b/gi, 'Maulsari'],
  [/\bmoulsari\b/gi, 'Molsari'],
  [/\bmaszid\b/gi, 'Masjid'],
  [/\bmashjid\b/gi, 'Masjid'],
  [/\bchoraha\b/gi, 'Chauraha'],
  [/\bchouraha\b/gi, 'Chauraha'],
  [/\bmuradabad\b/gi, 'Moradabad'],
  [/\bgajrola\b/gi, 'Gajraula'],
  [/\bchandosi\b/gi, 'Chandausi']
];

/**
 * Normalizes and expands user search text so phonetic Indian/UP spellings
 * (like "molsiry masjid") match Google Maps and local databases accurately.
 */
export function expandIndianSearchQueries(rawInput, activeCityName = 'Moradabad') {
  const clean = String(rawInput || '').trim();
  if (!clean) return [];

  const list = new Set([clean]);

  let normalized = clean;
  for (const [regex, replacement] of PHONETIC_MAP) {
    normalized = normalized.replace(regex, replacement);
  }
  if (normalized !== clean) {
    list.add(normalized);
  }

  if (/molsir[iy]/i.test(clean)) {
    list.add(clean.replace(/molsir[iy]/gi, 'Molsari'));
    list.add(clean.replace(/molsir[iy]/gi, 'Maulsari'));
  }

  const primaryQuery = normalized || clean;
  const cityClean = String(activeCityName || 'Moradabad').trim();
  if (cityClean && !primaryQuery.toLowerCase().includes(cityClean.toLowerCase())) {
    list.add(`${primaryQuery}, ${cityClean}, Uttar Pradesh`);
  }

  return Array.from(list);
}

/**
 * Matches curated UP landmarks & saved MongoDB cities for instant response
 */
export function matchLocalUpAndMongoCandidates(rawQuery, mongoCities = [], activeCityName = 'Moradabad', refCoords = null) {
  const qLower = String(rawQuery || '').trim().toLowerCase();
  if (qLower.length < 2) return [];

  const cities = Array.isArray(mongoCities) && mongoCities.length > 0 ? mongoCities : DEFAULT_MONGO_UP_CITIES;
  const matches = [];
  const tokens = qLower.split(/\s+/).filter(Boolean);

  for (const lm of LOCAL_UP_LANDMARKS) {
    const hay = `${lm.mainText} ${lm.secondaryText} ${lm.city} ${lm.keywords.join(' ')}`.toLowerCase();
    const isMatch = tokens.every((tok) => {
      if (hay.includes(tok)) return true;
      if (/^m[ao]u?ls[ia]?r[iy]$/i.test(tok) && hay.includes('molsari')) return true;
      if (/^mas[jz]id$/i.test(tok) && hay.includes('masjid')) return true;
      return false;
    });

    if (isMatch) {
      let distMeters = null;
      if (refCoords && typeof refCoords.lat === 'number' && typeof refCoords.lng === 'number') {
        distMeters = Math.round(calculateDistanceKm(refCoords.lat, refCoords.lng, lm.lat, lm.lng) * 1000);
      }
      matches.push({
        place_id: lm.place_id,
        description: lm.description,
        structured_formatting: {
          main_text: lm.mainText,
          secondary_text: lm.secondaryText
        },
        city: lm.city,
        state: lm.state,
        pincode: lm.pincode,
        lat: lm.lat,
        lng: lm.lng,
        distance_meters: distMeters,
        isMongoCity: true,
        isUttarPradesh: true,
        source: 'local_up_landmark'
      });
    }
  }

  // Also check if user is typing a saved MongoDB city name or pincode
  for (const city of cities) {
    const cName = String(city.name || '');
    const cState = String(city.state || 'Uttar Pradesh');
    const hay = `${cName} ${cState} ${(city.pincodes || []).join(' ')} ${(city.tags || []).join(' ')}`.toLowerCase();
    if (hay.includes(qLower)) {
      const [cLng, cLat] = city.location?.coordinates?.length === 2 ? city.location.coordinates : [78.7733, 28.8386];
      let distMeters = null;
      if (refCoords && typeof refCoords.lat === 'number' && typeof refCoords.lng === 'number') {
        distMeters = Math.round(calculateDistanceKm(refCoords.lat, refCoords.lng, cLat, cLng) * 1000);
      }
      matches.push({
        place_id: `mongo_city_${city.slug || cName.toLowerCase()}`,
        description: `${cName}, ${cState}${city.pincodes?.[0] ? ' ' + city.pincodes[0] : ''}, India`,
        structured_formatting: {
          main_text: cName,
          secondary_text: `${cState} • Serviceable City`
        },
        city: cName,
        state: cState,
        pincode: city.pincodes?.[0] || '',
        lat: cLat,
        lng: cLng,
        distance_meters: distMeters,
        isMongoCity: true,
        isUttarPradesh: /uttar pradesh/i.test(cState),
        source: 'mongodb_city'
      });
    }
  }

  return matches;
}

/**
 * Prioritizes, deduplicates, and sorts address recommendations:
 *   Tier 1 (Highest): Saved MongoDB Cities (weighted by city.rankingScore & activeCity match)
 *   Tier 2: Uttar Pradesh addresses
 *   Tier 3: Other Indian addresses
 *   Within each tier: sorted by closeness (distance_meters) to user's map/city coordinates.
 */
export function prioritizeIndianUpPredictions(
  rawPredictions = [],
  mongoCities = [],
  activeCityName = 'Moradabad',
  refCoords = null
) {
  const cities = Array.isArray(mongoCities) && mongoCities.length > 0 ? mongoCities : DEFAULT_MONGO_UP_CITIES;
  const seenKeys = new Set();
  const scored = [];

  for (const pred of rawPredictions) {
    if (!pred) continue;
    const mainText = pred.structured_formatting?.main_text || pred.mainText || (pred.description || '').split(',')[0] || '';
    const secondaryText = pred.structured_formatting?.secondary_text || pred.secondaryText || (pred.description || '').split(',').slice(1).join(',').trim() || '';
    const fullText = `${mainText} ${secondaryText} ${pred.description || ''} ${pred.city || ''} ${pred.state || ''}`.toLowerCase();

    const dedupKey = `${mainText.toLowerCase().replace(/[^a-z0-9]/g, '')}|${secondaryText.toLowerCase().slice(0, 28).replace(/[^a-z0-9]/g, '')}`;
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
      /india|bharat|delhi|uttarakhand|haryana|punjab|bihar|rajasthan|madhya pradesh|maharashtra/i.test(fullText) ||
      !pred.country ||
      /india|in/i.test(pred.country);

    if (!score) {
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

    // Extract 6-digit pincode if present in description
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
      state: isUp ? 'Uttar Pradesh' : (pred.state || 'India'),
      pincode: resolvedPincode,
      distance_meters: distMeters,
      isMongoCity: Boolean(matchedCity) || Boolean(pred.isMongoCity),
      mongoCityName: matchedCity?.name || resolvedCity,
      isUttarPradesh: isUp,
      priorityScore: score
    });
  }

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored.slice(0, 8);
}

/**
 * Helper to look up default pincode for a MongoDB saved city
 */
export function getDefaultPincodeForCity(cityName, mongoCities = []) {
  if (!cityName) return '';
  const cities = Array.isArray(mongoCities) && mongoCities.length > 0 ? mongoCities : DEFAULT_MONGO_UP_CITIES;
  const found = cities.find((c) => String(c.name || '').toLowerCase() === String(cityName).trim().toLowerCase());
  return found?.pincodes?.[0] || '';
}

