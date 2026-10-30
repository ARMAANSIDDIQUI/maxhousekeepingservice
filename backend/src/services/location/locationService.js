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

/**
 * Returns the exact raw query without altering or hardcoding place names.
 */
export function expandIndianQueryVariants(rawQuery) {
  const clean = String(rawQuery || '').trim();
  return clean ? [clean] : [];
}

/**
 * Scores and sorts a live address candidate against saved MongoDB cities:
 * 1. MongoDB Saved Cities priority (fetched from City collection, weighted by City.rankingScore)
 * 2. Uttar Pradesh state priority (UP state name or UP pincode 20xxxx-28xxxx)
 * 3. India country priority
 * 4. Distance to active reference coordinates
 */
export function computeAddressPriorityScore(item, mongoCities = [], activeCityName = '', refLat = null, refLng = null) {
  const fullText = `${item.mainText || ''} ${item.secondaryText || ''} ${item.description || ''} ${item.city || ''} ${item.state || ''}`.toLowerCase();
  let score = 0;
  let matchedMongoCity = null;

  // Check if item matches any saved MongoDB city fetched from the database
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

  // Native Google Places prediction boost
  if (item.source === 'google_autocomplete' || item.source === 'google_textsearch') {
    score += 3000;
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
 * Live autocomplete search that fetches saved cities from MongoDB FIRST,
 * then queries Google Places Autocomplete / TextSearch / Nominatim / Photon
 * with the user's exact query and prioritizes results matching MongoDB cities.
 */
export async function searchAndPrioritizeAddresses({ query, lat, lng, city: activeCityName }) {
  const rawQuery = String(query || '').trim();
  if (rawQuery.length < 2) {
    return [];
  }

  // 1. Fetch saved cities from MongoDB FIRST, sorted by rankingScore
  const mongoCities = await City.find({ status: { $ne: 'inactive' } })
    .sort({ rankingScore: -1, sortOrder: 1, name: 1 })
    .lean();

  const activeCityDoc =
    mongoCities.find(
      (c) => activeCityName && String(c.name || '').toLowerCase() === String(activeCityName).toLowerCase()
    ) || mongoCities[0];

  const refLat =
    typeof lat === 'number' && !isNaN(lat)
      ? lat
      : (activeCityDoc?.location?.coordinates?.[1] ?? 28.8386);
  const refLng =
    typeof lng === 'number' && !isNaN(lng)
      ? lng
      : (activeCityDoc?.location?.coordinates?.[0] ?? 78.7733);

  const candidates = [];

  // 2. Match saved MongoDB cities directly if user types a city name or pincode from MongoDB
  const qLower = rawQuery.toLowerCase();
  for (const c of mongoCities) {
    const cityHay = `${c.name} ${c.state || 'Uttar Pradesh'} ${(c.pincodes || []).join(' ')}`.toLowerCase();
    if (cityHay.includes(qLower)) {
      const [cLng, cLat] = c.location?.coordinates?.length === 2 ? c.location.coordinates : [refLng, refLat];
      candidates.push({
        place_id: `mongo_city_${c.slug || c._id}`,
        description: `${c.name}, ${c.state || 'Uttar Pradesh'}${c.pincodes?.[0] ? ' ' + c.pincodes[0] : ''}, India`,
        mainText: c.name,
        secondaryText: `${c.state || 'Uttar Pradesh'} • Serviceable City`,
        city: c.name,
        state: c.state || 'Uttar Pradesh',
        pincode: c.pincodes?.[0] || '',
        lat: cLat,
        lng: cLng,
        source: 'mongodb_city'
      });
    }
  }

  // 3. Resolve Google Maps API Key (env or MongoDB Settings)
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

  // 4. Google Places Autocomplete & TextSearch using the user's exact rawQuery
  if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    const autoUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(rawQuery)}&location=${refLat},${refLng}&radius=45000&key=${googleApiKey}`;
    fetchPromises.push(
      fetch(autoUrl, { signal: AbortSignal.timeout(3500) })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (Array.isArray(data?.predictions)) {
            for (const pred of data.predictions) {
              const pMatch = (pred.description || '').match(/\b([1-9][0-9]{5})\b/);
              candidates.push({
                place_id: pred.place_id,
                description: pred.description,
                mainText: pred.structured_formatting?.main_text || (pred.description || '').split(',')[0],
                secondaryText: pred.structured_formatting?.secondary_text || (pred.description || '').split(',').slice(1).join(',').trim(),
                pincode: pMatch ? pMatch[1] : '',
                source: 'google_autocomplete'
              });
            }
          }
        })
        .catch(() => {})
    );

    const gUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(rawQuery)}&location=${refLat},${refLng}&radius=45000&region=in&key=${googleApiKey}`;
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
                secondaryText: item.formatted_address || '',
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

  // 5. OpenStreetMap Nominatim (using exact rawQuery)
  const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(rawQuery)}`;
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

  // 6. Photon Komoot Geocoder (biased to active MongoDB city coordinates)
  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(rawQuery)}&lat=${refLat}&lon=${refLng}&limit=6`;
  fetchPromises.push(
    fetch(photonUrl, { signal: AbortSignal.timeout(3500) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.features)) {
          for (const f of data.features) {
            const p = f.properties || {};
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
              description: [mainText, ...secondaryParts, p.country || 'India'].filter(Boolean).join(', '),
              mainText,
              secondaryText: secondaryParts.join(', '),
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

  await Promise.allSettled(fetchPromises);

  // 7. Score, deduplicate, and sort candidates against MongoDB saved cities
  const seenKeys = new Set();
  const scoredResults = [];

  for (const item of candidates) {
    const dedupKey = item.place_id || `${String(item.mainText || '').toLowerCase().trim()}|${String(item.secondaryText || '').toLowerCase().trim()}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    const priority = computeAddressPriorityScore(item, mongoCities, activeCityDoc?.name || activeCityName, refLat, refLng);
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
      state: priority.isUttarPradesh ? 'Uttar Pradesh' : (item.state || ''),
      pincode: resolvedPincode,
      lat: item.lat,
      lng: item.lng,
      distance_meters: priority.distance_meters,
      isMongoCity: priority.isMongoCity,
      mongoCityName: priority.mongoCityName,
      isUttarPradesh: priority.isUttarPradesh,
      priorityScore: priority.score,
      source: item.source
    });
  }

  scoredResults.sort((a, b) => b.priorityScore - a.priorityScore);
  return scoredResults.slice(0, 10);
}

/**
 * Reverse geocode coordinates (lat, lng) into a complete street/area/landmark address,
 * matching against saved MongoDB cities fetched directly from the database.
 */
export async function reverseGeocodeLocation({ lat, lng }) {
  const numLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const numLng = typeof lng === 'number' ? lng : parseFloat(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    return null;
  }

  // Fetch saved cities from MongoDB FIRST
  const mongoCities = await City.find({ status: { $ne: 'inactive' } })
    .sort({ rankingScore: -1, sortOrder: 1 })
    .lean();

  let nearestCity = null;
  let minCityDist = Infinity;
  for (const c of mongoCities) {
    if (c.location?.coordinates?.length === 2) {
      const [cLng, cLat] = c.location.coordinates;
      const distKm = calculateDistanceKm(numLat, numLng, cLat, cLng);
      if (distKm < minCityDist) {
        minCityDist = distKm;
        nearestCity = { ...c, distanceKm: distKm };
      }
    }
  }

  let streetAddress = '';
  let areaOrLandmark = '';
  let detectedCity = (nearestCity && nearestCity.distanceKm <= (nearestCity.serviceRadiusKm || 30)) ? nearestCity.name : '';
  let detectedState = nearestCity?.state || 'Uttar Pradesh';
  let detectedPincode = nearestCity?.pincodes?.[0] || '';

  // 1. Try Google Maps Reverse Geocoding if API key is configured
  let googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!googleApiKey) {
    try {
      const settings = await Settings.getSingleton();
      googleApiKey = settings?.integrations?.googleMapsApiKey || '';
    } catch {
      // ignore
    }
  }

  if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    try {
      const gRevUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${numLat},${numLng}&key=${googleApiKey}`;
      const gRes = await fetch(gRevUrl, { signal: AbortSignal.timeout(3500) });
      if (gRes.ok) {
        const gData = await gRes.json();
        const first = gData?.results?.[0];
        if (first) {
          streetAddress = first.formatted_address || '';
          for (const comp of first.address_components || []) {
            const types = comp.types || [];
            if (!areaOrLandmark && (types.includes('point_of_interest') || types.includes('establishment') || types.includes('sublocality') || types.includes('neighborhood'))) {
              areaOrLandmark = comp.long_name;
            }
            if (!detectedCity && (types.includes('locality') || types.includes('administrative_area_level_2'))) {
              detectedCity = comp.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              detectedState = comp.long_name;
            }
            if (types.includes('postal_code')) {
              detectedPincode = comp.long_name;
            }
          }
        }
      }
    } catch {
      // fallback to Nominatim
    }
  }

  // 2. Try OpenStreetMap Nominatim Reverse
  if (!streetAddress) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'MaxHousekeepingApp/1.0 (https://maxhousekeeping.in)',
          'Accept-Language': 'en'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (nomRes.ok) {
        const data = await nomRes.json();
        const addr = data?.address || {};
        const parts = [
          data?.name,
          addr.amenity || addr.building || addr.shop || addr.historic,
          addr.road || addr.pedestrian || addr.street,
          addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.village,
          detectedCity || addr.city || addr.town || addr.county || addr.state_district,
          addr.state || detectedState
        ].filter((x, idx, arr) => x && arr.indexOf(x) === idx);

        if (parts.length > 0) {
          streetAddress = parts.join(', ');
        } else if (data?.display_name) {
          streetAddress = data.display_name;
        }

        if (!areaOrLandmark) {
          areaOrLandmark = addr.amenity || addr.neighbourhood || addr.suburb || addr.road || '';
        }
        if (!detectedCity) {
          detectedCity = addr.city || addr.town || addr.county || addr.state_district || '';
        }
        if (addr.state) {
          detectedState = addr.state;
        }
        if (addr.postcode) {
          const cleanPin = String(addr.postcode).replace(/\D/g, '').slice(0, 6);
          if (cleanPin.length === 6) detectedPincode = cleanPin;
        }
      }
    } catch {
      // fallback to Photon
    }
  }

  // 3. Fallback to Photon Komoot Reverse
  if (!streetAddress) {
    try {
      const photRes = await fetch(`https://photon.komoot.io/reverse?lat=${numLat}&lon=${numLng}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (photRes.ok) {
        const photData = await photRes.json();
        const p = photData?.features?.[0]?.properties;
        if (p) {
          const parts = [
            p.name,
            p.street,
            p.locality || p.district,
            detectedCity || p.city || p.county,
            p.state || detectedState
          ].filter((x, idx, arr) => x && arr.indexOf(x) === idx);
          if (parts.length > 0) {
            streetAddress = parts.join(', ');
          }
          if (!areaOrLandmark) {
            areaOrLandmark = p.name || p.locality || p.street || '';
          }
          if (!detectedCity && (p.city || p.district || p.county)) {
            detectedCity = p.city || p.district || p.county;
          }
          if (p.postcode) {
            const cleanPin = String(p.postcode).replace(/\D/g, '').slice(0, 6);
            if (cleanPin.length === 6) detectedPincode = cleanPin;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const finalCity = detectedCity || nearestCity?.name || '';
  const finalPincode = detectedPincode || nearestCity?.pincodes?.[0] || '';
  const finalStreet = streetAddress || [areaOrLandmark, finalCity, detectedState, finalPincode].filter(Boolean).join(', ');

  return {
    line1: finalStreet,
    formattedAddress: finalStreet,
    landmark: areaOrLandmark,
    city: finalCity,
    state: detectedState,
    pincode: finalPincode,
    coordinates: { lat: numLat, lng: numLng }
  };
}

/**
 * Resolves a customer's location against serviceable cities in MongoDB
 * Checks pincode first, then Geo coordinates
 */
export async function resolveLocation({ pincode, lat, lng }) {
  // 1. Try resolving by 6-digit Pincode in MongoDB
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

  // 2. Try resolving by GPS coordinates [lng, lat] in MongoDB
  if (typeof lat === 'number' && typeof lng === 'number') {
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
    message: 'Location could not be matched with our active coverage zones in Uttar Pradesh.'
  };
}

export default {
  calculateDistanceKm,
  resolveLocation,
  expandIndianQueryVariants,
  computeAddressPriorityScore,
  searchAndPrioritizeAddresses,
  reverseGeocodeLocation
};
