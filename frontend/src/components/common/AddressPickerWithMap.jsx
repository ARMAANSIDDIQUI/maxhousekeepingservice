import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LuMapPin,
  LuSearch,
  LuNavigation,
  LuBuilding2,
  LuCompass,
  LuInfo,
  LuCircleAlert,
  LuCheck,
  LuLoader
} from 'react-icons/lu';
import { loadGoogleMapsScript } from '../../utils/googleMapsLoader';
import {
  DEFAULT_MONGO_UP_CITIES,
  expandIndianSearchQueries,
  matchLocalUpAndMongoCandidates,
  prioritizeIndianUpPredictions,
  getDefaultPincodeForCity
} from '../../utils/addressPriority';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');

/**
 * AddressPickerWithMap
 * Simple, accurate address autofill + interactive map picker.
 * Prioritizes:
 *   1. Saved MongoDB Cities (Moradabad, Rampur, Amroha, Sambhal, Chandausi, Gajraula, Bijnor, Dhampur, etc.)
 *   2. Uttar Pradesh locations
 *   3. Other Indian locations
 */
export default function AddressPickerWithMap({
  value = {},
  onChange,
  defaultCity = 'Moradabad',
  disabled = false,
  error = null
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [mongoCities, setMongoCities] = useState(DEFAULT_MONGO_UP_CITIES);

  // Address fields state
  const initialCity = value.cityText || value.city || defaultCity || 'Moradabad';
  const initialPincode = value.pincode || getDefaultPincodeForCity(initialCity, DEFAULT_MONGO_UP_CITIES) || '244001';

  const [houseOrFlat, setHouseOrFlat] = useState(value.houseOrFlat || '');
  const [streetQuery, setStreetQuery] = useState(value.line1 || value.formattedAddress || '');
  const [landmark, setLandmark] = useState(value.landmark || '');
  const [cityText, setCityText] = useState(initialCity);
  const [stateText, setStateText] = useState(value.stateText || value.state || 'Uttar Pradesh');
  const [pincode, setPincode] = useState(initialPincode);
  const [coordinates, setCoordinates] = useState(
    value.coordinates && typeof value.coordinates.lat === 'number'
      ? value.coordinates
      : { lat: 28.8386, lng: 78.7733 } // Default Moradabad coordinates
  );

  // Autocomplete prediction state
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [refinementTip, setRefinementTip] = useState('');

  // Google Maps SDK references
  const containerWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const reverseGeocodeRef = useRef(null);
  const lastEmittedLine1Ref = useRef(value.line1 || value.formattedAddress || '');

  // Load saved serviceable cities from MongoDB backend
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/locations/cities`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.cities) && data.cities.length > 0) {
          setMongoCities(data.cities);
          if (!pincode) {
            const defPin = getDefaultPincodeForCity(cityText, data.cities);
            if (defPin) setPincode(defPin);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerWrapperRef.current && !containerWrapperRef.current.contains(e.target)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync internal state when prop value changes
  useEffect(() => {
    if (value.houseOrFlat !== undefined && value.houseOrFlat !== houseOrFlat) {
      setHouseOrFlat(value.houseOrFlat || '');
    }
    if (
      value.line1 !== undefined &&
      value.line1 !== streetQuery &&
      value.line1 !== lastEmittedLine1Ref.current &&
      !showPredictions &&
      !isLocatingUser
    ) {
      setStreetQuery(value.line1 || value.formattedAddress || '');
      lastEmittedLine1Ref.current = value.line1 || value.formattedAddress || '';
    }
    if (value.landmark !== undefined && value.landmark !== landmark) {
      setLandmark(value.landmark || '');
    }
    if (value.cityText && value.cityText !== cityText) {
      setCityText(value.cityText);
    }
    if (value.pincode && value.pincode !== pincode) {
      setPincode(value.pincode);
    }
    if (value.coordinates && typeof value.coordinates.lat === 'number') {
      if (value.coordinates.lat !== coordinates.lat || value.coordinates.lng !== coordinates.lng) {
        setCoordinates(value.coordinates);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition(value.coordinates);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(value.coordinates);
        }
      }
    }
  }, [value]);

  // Dispatch change upwards
  const emitChange = useCallback((updatedFields) => {
    if (typeof onChange === 'function') {
      const nextCity = updatedFields.cityText ?? updatedFields.city ?? cityText;
      const fallbackPin = getDefaultPincodeForCity(nextCity, mongoCities) || '244001';
      const nextPin = updatedFields.pincode || pincode || fallbackPin;

      const nextLine1 = updatedFields.line1 !== undefined ? updatedFields.line1 : streetQuery;
      lastEmittedLine1Ref.current = nextLine1;

      const merged = {
        houseOrFlat,
        line1: nextLine1,
        formattedAddress: updatedFields.formattedAddress !== undefined ? updatedFields.formattedAddress : nextLine1,
        landmark,
        cityText: nextCity,
        city: nextCity,
        stateText,
        state: stateText,
        pincode: nextPin,
        coordinates,
        ...updatedFields
      };
      onChange(merged);
    }
  }, [houseOrFlat, streetQuery, landmark, cityText, stateText, pincode, coordinates, mongoCities, onChange]);

  // Helper to extract city, state and pincode from array of Google geocode/places results
  const extractFromGeocodeResults = (results) => {
    let detectedCity = '';
    let detectedState = '';
    let detectedPincode = '';

    if (!Array.isArray(results)) return { city: '', state: '', pincode: '' };

    for (const res of results) {
      for (const comp of res.address_components || []) {
        const types = comp.types || [];
        if (!detectedPincode && types.includes('postal_code')) {
          detectedPincode = comp.long_name || comp.short_name;
        }
        if (!detectedCity && (types.includes('locality') || types.includes('administrative_area_level_2'))) {
          detectedCity = comp.long_name;
        }
        if (!detectedState && types.includes('administrative_area_level_1')) {
          detectedState = comp.long_name;
        }
      }
    }
    return {
      city: detectedCity,
      state: detectedState,
      pincode: detectedPincode
    };
  };

  // Extract components from Google Place details
  const extractAddressComponents = (placeDetails, updateStreet = true) => {
    const components = placeDetails.address_components || [];
    let detectedCity = placeDetails.city || '';
    let detectedState = placeDetails.state || '';
    let detectedPincode = placeDetails.pincode || '';

    for (const comp of components) {
      const types = comp.types || [];
      if (types.includes('postal_code')) {
        detectedPincode = comp.long_name || comp.short_name;
      }
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        if (!detectedCity) detectedCity = comp.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        detectedState = comp.long_name;
      }
    }

    const finalCity = detectedCity || cityText || defaultCity;
    const finalState = detectedState || stateText || 'Uttar Pradesh';
    const finalPincode = detectedPincode || getDefaultPincodeForCity(finalCity, mongoCities) || pincode || '244001';

    setCityText(finalCity);
    setStateText(finalState);
    setPincode(finalPincode);

    if (updateStreet && placeDetails.formatted_address) {
      setStreetQuery(placeDetails.formatted_address);
    }

    return {
      city: finalCity,
      state: finalState,
      pincode: finalPincode
    };
  };

  // Bounce marker briefly to confirm pin position
  const triggerPinDropAnimation = () => {
    if (markerInstanceRef.current && window.google?.maps?.Animation) {
      markerInstanceRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        try {
          markerInstanceRef.current?.setAnimation(null);
        } catch (_) {}
      }, 1000);
    }
  };

  // Load Google Maps SDK
  useEffect(() => {
    let isMounted = true;
    setIsLoadingKey(true);

    loadGoogleMapsScript()
      .then((googleMaps) => {
        if (!isMounted) return;
        setMapLoaded(true);
        setIsLoadingKey(false);

        try {
          if (googleMaps.places?.AutocompleteService) {
            autocompleteServiceRef.current = new googleMaps.places.AutocompleteService();
          }
          if (googleMaps.places?.AutocompleteSessionToken) {
            sessionTokenRef.current = new googleMaps.places.AutocompleteSessionToken();
          }
          if (googleMaps.Geocoder) {
            geocoderRef.current = new googleMaps.Geocoder();
          }
        } catch (err) {
          console.warn('[AddressPickerWithMap] Init service error:', err);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[AddressPickerWithMap] Google Maps not available:', err.message);
        setMapError(err.message);
        setIsLoadingKey(false);
      });

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Initialize Map canvas once SDK is ready — keeping POI labels visible so mosques, temples & landmarks show!
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const google = window.google;
      const initialPos = (coordinates && typeof coordinates.lat === 'number')
        ? coordinates
        : { lat: 28.8386, lng: 78.7733 };

      const map = new google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

      const marker = new google.maps.Marker({
        position: initialPos,
        map: map,
        draggable: !disabled,
        title: 'Drag marker to your exact house or gate',
        animation: google.maps.Animation.DROP
      });

      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        if (newPos && reverseGeocodeRef.current) {
          reverseGeocodeRef.current({ lat: newPos.lat(), lng: newPos.lng() }, true);
        }
      });

      map.addListener('click', (e) => {
        if (disabled) return;
        const newCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(newCoords);
        if (reverseGeocodeRef.current) {
          reverseGeocodeRef.current(newCoords, true);
        }
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
      if (google.maps.places?.PlacesService) {
        placesServiceRef.current = new google.maps.places.PlacesService(map);
      }
    } catch (err) {
      console.warn('[AddressPickerWithMap] Map canvas init error:', err);
    }
  }, [mapLoaded, disabled]);

  // Multi-source search combining:
  // 1. Local UP landmarks & MongoDB saved cities
  // 2. Google Places AutocompleteService (with phonetic query support)
  // 3. Google Places TextSearch (catches mosques, landmarks & local spellings like "molsiry masjid")
  // 4. Backend /api/v1/locations/autocomplete (MongoDB cities + Nominatim India + Photon UP)
  const runMultiEngineAddressSearch = async (rawQuery, refLat, refLng) => {
    const queryVariants = expandIndianSearchQueries(rawQuery, cityText);
    const primaryQuery = queryVariants[0] || rawQuery;
    const localMatches = matchLocalUpAndMongoCandidates(rawQuery, mongoCities, cityText, { lat: refLat, lng: refLng });

    // Show instant local UP / MongoDB matches immediately while live APIs resolve
    if (localMatches.length > 0) {
      const initialRanked = prioritizeIndianUpPredictions(localMatches, mongoCities, cityText, { lat: refLat, lng: refLng });
      setPredictions(initialRanked);
      setShowPredictions(true);
    }

    const tasks = [];

    // Source A: Google Places AutocompleteService
    if (autocompleteServiceRef.current && !disabled) {
      tasks.push(
        new Promise((resolve) => {
          const request = {
            input: primaryQuery,
            componentRestrictions: { country: 'in' }
          };
          if (sessionTokenRef.current) {
            request.sessionToken = sessionTokenRef.current;
          }
          if (window.google?.maps?.LatLng) {
            try {
              request.origin = new window.google.maps.LatLng(refLat, refLng);
            } catch (_) {}
          }
          if (window.google?.maps?.Circle) {
            try {
              request.locationBias = new window.google.maps.Circle({
                center: { lat: refLat, lng: refLng },
                radius: 45000
              });
            } catch (_) {}
          }

          autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
            const isOk = window.google?.maps?.places?.PlacesServiceStatus?.OK;
            if (status === isOk && Array.isArray(results)) {
              resolve(results);
            } else {
              resolve([]);
            }
          });
        })
      );
    }

    // Source B: Google Places TextSearch (handles fuzzy landmark names like "molsiry masjid" -> Molsari Masjid)
    if (placesServiceRef.current && !disabled) {
      tasks.push(
        new Promise((resolve) => {
          const textQuery = queryVariants[queryVariants.length - 1] || `${primaryQuery}, ${cityText || 'Moradabad'}, Uttar Pradesh`;
          const req = {
            query: textQuery,
            region: 'in'
          };
          if (window.google?.maps?.LatLng) {
            try {
              req.location = new window.google.maps.LatLng(refLat, refLng);
              req.radius = 35000;
            } catch (_) {}
          }

          placesServiceRef.current.textSearch(req, (results, status) => {
            const isOk = window.google?.maps?.places?.PlacesServiceStatus?.OK;
            if (status === isOk && Array.isArray(results)) {
              const mapped = results.slice(0, 6).map((r) => {
                const lat = typeof r.geometry?.location?.lat === 'function' ? r.geometry.location.lat() : r.geometry?.location?.lat;
                const lng = typeof r.geometry?.location?.lng === 'function' ? r.geometry.location.lng() : r.geometry?.location?.lng;
                const pinMatch = (r.formatted_address || '').match(/\b([1-9][0-9]{5})\b/);
                return {
                  place_id: r.place_id,
                  description: r.formatted_address && !r.formatted_address.toLowerCase().startsWith((r.name || '').toLowerCase())
                    ? `${r.name}, ${r.formatted_address}`
                    : (r.formatted_address || r.name),
                  structured_formatting: {
                    main_text: r.name || (r.formatted_address || '').split(',')[0],
                    secondary_text: r.formatted_address || `${cityText}, Uttar Pradesh`
                  },
                  lat,
                  lng,
                  pincode: pinMatch ? pinMatch[1] : '',
                  geometry: r.geometry,
                  source: 'google_text_search'
                };
              });
              resolve(mapped);
            } else {
              resolve([]);
            }
          });
        })
      );
    }

    // Source C: Backend Autocomplete API (MongoDB Saved Cities + Nominatim India + Photon UP)
    tasks.push(
      fetch(
        `${API_BASE_URL}/locations/autocomplete?q=${encodeURIComponent(rawQuery)}&lat=${refLat}&lng=${refLng}&city=${encodeURIComponent(cityText || '')}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => (Array.isArray(data?.predictions) ? data.predictions : []))
        .catch(() => [])
    );

    const settled = await Promise.all(tasks);
    const combined = [...localMatches, ...settled.flat()];

    const ranked = prioritizeIndianUpPredictions(combined, mongoCities, cityText, {
      lat: refLat,
      lng: refLng
    });

    setIsSearching(false);
    setPredictions(ranked);
    setShowPredictions(ranked.length > 0);
  };

  // Handle typing in the main address / area / landmark search box
  const handleStreetInputChange = (e) => {
    const query = e.target.value;
    setStreetQuery(query);
    emitChange({ line1: query, formattedAddress: query });

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.trim().length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Instant local check before debounce timer completes
    const refLat = coordinates?.lat || 28.8386;
    const refLng = coordinates?.lng || 78.7733;
    const instantLocal = matchLocalUpAndMongoCandidates(query, mongoCities, cityText, { lat: refLat, lng: refLng });
    if (instantLocal.length > 0) {
      setPredictions(prioritizeIndianUpPredictions(instantLocal, mongoCities, cityText, { lat: refLat, lng: refLng }));
      setShowPredictions(true);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsSearching(true);
      runMultiEngineAddressSearch(query, refLat, refLng);
    }, 220);
  };

  // Search and move map pin when user clicks "Find on Map" or presses Enter
  const handleRefineLocationFromSearch = (searchText = streetQuery) => {
    const query = (searchText || '').trim();
    if (!query) return;

    setShowPredictions(false);
    setIsSearching(true);

    const expanded = expandIndianSearchQueries(query, cityText);
    const fullSearchAddress = expanded[expanded.length - 1] || query;

    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        {
          address: fullSearchAddress,
          componentRestrictions: { country: 'in' }
        },
        (results, status) => {
          setIsSearching(false);
          if (status === 'OK' && results && results[0]) {
            const best = results[0];
            const loc = best.geometry?.location;
            if (loc) {
              const newCoords = { lat: loc.lat(), lng: loc.lng() };
              const comps = extractFromGeocodeResults(results);
              applyLocationCoordinates(newCoords, {
                line1: query,
                city: comps.city || cityText,
                state: comps.state || stateText,
                pincode: comps.pincode || getDefaultPincodeForCity(comps.city || cityText, mongoCities) || pincode
              });
            }
          }
        }
      );
    } else {
      setIsSearching(false);
    }
  };

  // Move map, bounce pin, and update city/pincode
  const applyLocationCoordinates = (newCoords, meta = {}) => {
    setCoordinates(newCoords);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(newCoords);
      mapInstanceRef.current.setZoom(17);
    }

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setPosition(newCoords);
      triggerPinDropAnimation();
    }

    const newCity = meta.city || cityText || defaultCity;
    const newState = meta.state || stateText || 'Uttar Pradesh';
    const newPincode = meta.pincode || getDefaultPincodeForCity(newCity, mongoCities) || pincode || '244001';
    const newLine1 = meta.line1 || streetQuery;

    setCityText(newCity);
    setStateText(newState);
    setPincode(newPincode);
    if (newLine1) setStreetQuery(newLine1);

    setRefinementTip(`Location set in ${newCity} (${newPincode}).`);

    emitChange({
      coordinates: newCoords,
      line1: newLine1,
      formattedAddress: newLine1,
      cityText: newCity,
      city: newCity,
      stateText: newState,
      state: newState,
      pincode: newPincode
    });
  };

  // When user picks a recommendation from the dropdown
  const handleSelectPrediction = (prediction) => {
    setShowPredictions(false);
    const chosenText = prediction.description || prediction.structured_formatting?.main_text || '';
    setStreetQuery(chosenText);

    // If prediction already has lat/lng (from local UP landmark, backend autocomplete, Photon, Nominatim, or Google TextSearch)
    if (typeof prediction.lat === 'number' && typeof prediction.lng === 'number') {
      const newCoords = { lat: prediction.lat, lng: prediction.lng };
      const resolvedCity = prediction.city || prediction.mongoCityName || cityText;
      const resolvedPin = prediction.pincode || getDefaultPincodeForCity(resolvedCity, mongoCities) || pincode;
      applyLocationCoordinates(newCoords, {
        line1: chosenText,
        city: resolvedCity,
        state: prediction.state || 'Uttar Pradesh',
        pincode: resolvedPin
      });
      return;
    }

    if (prediction.geometry?.location) {
      const lat = typeof prediction.geometry.location.lat === 'function'
        ? prediction.geometry.location.lat()
        : prediction.geometry.location.lat;
      const lng = typeof prediction.geometry.location.lng === 'function'
        ? prediction.geometry.location.lng()
        : prediction.geometry.location.lng;
      const newCoords = { lat, lng };
      const comps = extractAddressComponents(prediction, true);
      applyLocationCoordinates(newCoords, {
        line1: chosenText,
        city: comps.city,
        state: comps.state,
        pincode: comps.pincode
      });
      return;
    }

    if (!placesServiceRef.current || !prediction.place_id) {
      handleRefineLocationFromSearch(chosenText);
      return;
    }

    setIsSearching(true);
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['name', 'geometry', 'formatted_address', 'address_components', 'place_id'],
        sessionToken: sessionTokenRef.current
      },
      (place, status) => {
        setIsSearching(false);
        if (window.google?.maps?.places?.AutocompleteSessionToken) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }

        if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const newCoords = { lat, lng };

          const displayAddr = chosenText || place.formatted_address;
          const comps = extractAddressComponents(place, false);
          setStreetQuery(displayAddr);

          if (!comps.pincode && geocoderRef.current) {
            geocoderRef.current.geocode({ location: newCoords }, (geoResults, geoStatus) => {
              const geoComps = (geoStatus === 'OK' && geoResults) ? extractFromGeocodeResults(geoResults) : {};
              const finalCity = geoComps.city || comps.city || cityText;
              const finalPin = geoComps.pincode || comps.pincode || getDefaultPincodeForCity(finalCity, mongoCities) || pincode;
              applyLocationCoordinates(newCoords, {
                line1: displayAddr,
                city: finalCity,
                state: geoComps.state || comps.state || 'Uttar Pradesh',
                pincode: finalPin
              });
            });
          } else {
            applyLocationCoordinates(newCoords, {
              line1: displayAddr,
              city: comps.city,
              state: comps.state,
              pincode: comps.pincode
            });
          }
        } else {
          handleRefineLocationFromSearch(chosenText);
        }
      }
    );
  };

  // Quick-select one of our saved MongoDB cities
  const handleSelectMongoCity = (cityObj) => {
    if (disabled || !cityObj) return;
    const cName = cityObj.name;
    const cState = cityObj.state || 'Uttar Pradesh';
    const cPin = cityObj.pincodes?.[0] || getDefaultPincodeForCity(cName, mongoCities) || pincode;
    const [cLng, cLat] = cityObj.location?.coordinates?.length === 2
      ? cityObj.location.coordinates
      : [78.7733, 28.8386];

    setCityText(cName);
    setStateText(cState);
    if (cPin) setPincode(cPin);

    const newCoords = { lat: cLat, lng: cLng };
    setCoordinates(newCoords);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(newCoords);
      mapInstanceRef.current.setZoom(14);
    }
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setPosition(newCoords);
    }

    emitChange({
      cityText: cName,
      city: cName,
      stateText: cState,
      state: cState,
      pincode: cPin,
      coordinates: newCoords
    });
  };

  // Multi-source Reverse Geocoding that ALWAYS autofills the Search Street / Area / Landmark bar, City, Pincode & Landmark
  const reverseGeocodeAndAutofill = useCallback(async (newCoords, updateSearchBar = true) => {
    const { lat, lng } = newCoords;
    setCoordinates(newCoords);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(newCoords);
      mapInstanceRef.current.setZoom(17);
    }
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setPosition(newCoords);
      triggerPinDropAnimation();
    }

    let resolvedAddress = '';
    let resolvedLandmark = '';
    let resolvedCity = '';
    let resolvedState = '';
    let resolvedPincode = '';

    // 1. Try our Backend Reverse Geocoding API first (combines MongoDB UP Cities + Nominatim + Photon)
    try {
      const backendRes = await fetch(
        `${API_BASE_URL}/locations/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
      );
      if (backendRes.ok) {
        const bData = await backendRes.json();
        if (bData?.success) {
          resolvedAddress = bData.line1 || bData.formattedAddress || '';
          resolvedLandmark = bData.landmark || '';
          resolvedCity = bData.city || '';
          resolvedState = bData.state || '';
          resolvedPincode = bData.pincode || '';
        }
      }
    } catch (_) {}

    // 2. Try Google Geocoder (if available and enabled on API key)
    if ((!resolvedAddress || !resolvedPincode) && geocoderRef.current) {
      try {
        const geoRes = await new Promise((resolve) => {
          geocoderRef.current.geocode({ location: newCoords }, (results, status) => {
            if (status === 'OK' && Array.isArray(results) && results.length > 0) {
              resolve(results);
            } else {
              resolve(null);
            }
          });
        });

        if (geoRes) {
          const bestReadable = geoRes.find(
            (r) => r.formatted_address && !/^[A-Z0-9]{4}\+[A-Z0-9]{2,}/i.test(r.formatted_address.trim())
          ) || geoRes[0];
          if (!resolvedAddress && bestReadable?.formatted_address) {
            resolvedAddress = bestReadable.formatted_address;
          }
          const comps = extractFromGeocodeResults(geoRes);
          if (!resolvedCity && comps.city) resolvedCity = comps.city;
          if (!resolvedState && comps.state) resolvedState = comps.state;
          if (!resolvedPincode && comps.pincode) resolvedPincode = comps.pincode;

          for (const res of geoRes) {
            for (const c of res.address_components || []) {
              if (
                !resolvedLandmark &&
                (c.types?.includes('sublocality_level_1') ||
                  c.types?.includes('neighborhood') ||
                  c.types?.includes('point_of_interest'))
              ) {
                resolvedLandmark = c.long_name;
              }
            }
          }
        }
      } catch (_) {}
    }

    // 3. Fallback / Enrichment via OpenStreetMap Nominatim Reverse Geocoding
    if (!resolvedAddress || !resolvedPincode || !resolvedCity) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (nomRes.ok) {
          const data = await nomRes.json();
          const addr = data?.address || {};
          const roadOrArea = [
            data?.name,
            addr.amenity || addr.building || addr.shop,
            addr.road || addr.pedestrian || addr.street,
            addr.neighbourhood || addr.suburb || addr.residential || addr.village,
            addr.city || addr.town || addr.county || addr.state_district,
            addr.state,
            addr.postcode
          ]
            .filter((x, i, a) => x && a.indexOf(x) === i)
            .join(', ');

          if (!resolvedAddress) {
            resolvedAddress = roadOrArea || data?.display_name || '';
          }
          if (!resolvedLandmark) {
            resolvedLandmark = addr.amenity || addr.neighbourhood || addr.suburb || '';
          }
          if (!resolvedCity) {
            resolvedCity = addr.city || addr.town || addr.county || addr.state_district || '';
          }
          if (!resolvedState) {
            resolvedState = addr.state || '';
          }
          if (!resolvedPincode && addr.postcode) {
            const cleanPin = String(addr.postcode).replace(/\D/g, '').slice(0, 6);
            if (cleanPin.length === 6) resolvedPincode = cleanPin;
          }
        }
      } catch (_) {}
    }

    // 4. Secondary Fallback via Photon Komoot Reverse Geocoding
    if (!resolvedAddress || !resolvedCity) {
      try {
        const photRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
        if (photRes.ok) {
          const photData = await photRes.json();
          const p = photData?.features?.[0]?.properties;
          if (p) {
            const parts = [p.name, p.street, p.locality || p.district, p.city, p.state, p.postcode]
              .filter((x, i, a) => x && a.indexOf(x) === i);
            if (!resolvedAddress && parts.length > 0) {
              resolvedAddress = parts.join(', ');
            }
            if (!resolvedLandmark && (p.name || p.locality)) {
              resolvedLandmark = p.name || p.locality;
            }
            if (!resolvedCity && (p.city || p.district || p.county)) {
              resolvedCity = p.city || p.district || p.county;
            }
            if (!resolvedState && p.state) {
              resolvedState = p.state;
            }
            if (!resolvedPincode && p.postcode) {
              resolvedPincode = String(p.postcode).replace(/\D/g, '').slice(0, 6);
            }
          }
        }
      } catch (_) {}
    }

    // 5. Tertiary Fallback via BigDataCloud Client Reverse Geocoding (CORS-friendly, zero API key required)
    if (!resolvedAddress || !resolvedCity || !resolvedPincode) {
      try {
        const bdcRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (bdcRes.ok) {
          const bdc = await bdcRes.json();
          const areaParts = [
            bdc.locality,
            bdc.city,
            bdc.principalSubdivision,
            bdc.postcode
          ].filter((x, i, a) => x && a.indexOf(x) === i);

          if (!resolvedAddress && areaParts.length > 0) {
            resolvedAddress = areaParts.join(', ');
          }
          if (!resolvedLandmark && bdc.locality) {
            resolvedLandmark = bdc.locality;
          }
          if (!resolvedCity && (bdc.city || bdc.locality)) {
            resolvedCity = bdc.city || bdc.locality;
          }
          if (!resolvedState && bdc.principalSubdivision) {
            resolvedState = bdc.principalSubdivision;
          }
          if (!resolvedPincode && bdc.postcode) {
            const cleanPin = String(bdc.postcode).replace(/\D/g, '').slice(0, 6);
            if (cleanPin.length === 6) resolvedPincode = cleanPin;
          }
        }
      } catch (_) {}
    }

    // 6. Match nearest saved MongoDB city if within its radius
    let matchedMongoCity = null;
    for (const c of mongoCities) {
      if (resolvedCity && String(c.name || '').toLowerCase() === resolvedCity.toLowerCase()) {
        matchedMongoCity = c;
        break;
      }
      if (c.location?.coordinates?.length === 2) {
        const [cLng, cLat] = c.location.coordinates;
        const dLat = (lat - cLat) * (Math.PI / 180);
        const dLon = (lng - cLng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(cLat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distKm <= (c.serviceRadiusKm || 25)) {
          matchedMongoCity = c;
          break;
        }
      }
    }

    const finalCity = matchedMongoCity?.name || resolvedCity || cityText || defaultCity || 'Moradabad';
    const finalState = resolvedState || matchedMongoCity?.state || stateText || 'Uttar Pradesh';
    const finalPincode =
      resolvedPincode ||
      matchedMongoCity?.pincodes?.[0] ||
      getDefaultPincodeForCity(finalCity, mongoCities) ||
      pincode ||
      '244001';
    const finalAddress =
      resolvedAddress ||
      (resolvedLandmark
        ? `${resolvedLandmark}, ${finalCity}, ${finalState} - ${finalPincode}`
        : `${finalCity}, ${finalState} - ${finalPincode}`);
    const finalLandmark = resolvedLandmark || landmark || '';

    setCityText(finalCity);
    setStateText(finalState);
    setPincode(finalPincode);
    if (updateSearchBar || !streetQuery) {
      lastEmittedLine1Ref.current = finalAddress;
      setStreetQuery(finalAddress);
    }
    if (resolvedLandmark) {
      setLandmark(resolvedLandmark);
    }

    setRefinementTip(`GPS location autofilled in search bar: ${finalAddress}`);

    const nextLine1 = (updateSearchBar || !streetQuery) ? finalAddress : streetQuery;
    emitChange({
      coordinates: newCoords,
      line1: nextLine1,
      formattedAddress: finalAddress,
      landmark: finalLandmark,
      cityText: finalCity,
      city: finalCity,
      stateText: finalState,
      state: finalState,
      pincode: finalPincode
    });
  }, [cityText, stateText, pincode, streetQuery, landmark, mongoCities, defaultCity, emitChange]);

  useEffect(() => {
    reverseGeocodeRef.current = reverseGeocodeAndAutofill;
  }, [reverseGeocodeAndAutofill]);

  // Use Current Phone/Browser Location ("Locate Me (GPS)") & Autofill "Search Street / Area / Landmark:" Bar
  const handleUseCurrentLocation = async () => {
    setIsLocatingUser(true);
    setShowPredictions(false);

    const getBrowserCoords = (options) =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    let detectedCoords = null;

    // Step 1: Try High-Accuracy GPS first
    try {
      const pos = await getBrowserCoords({
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      });
      detectedCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
    } catch (_) {
      // Step 2: Retry with Standard/Network Location (faster on laptops & desktops)
      try {
        const posLow = await getBrowserCoords({
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000
        });
        detectedCoords = {
          lat: posLow.coords.latitude,
          lng: posLow.coords.longitude
        };
      } catch (_) {}
    }

    // Step 3: If browser geolocation timed out or was blocked, fall back to IP/Client location or current map pin
    if (!detectedCoords) {
      try {
        const ipRes = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
            detectedCoords = { lat: ipData.latitude, lng: ipData.longitude };
          }
        }
      } catch (_) {}
    }

    if (!detectedCoords) {
      detectedCoords =
        coordinates && typeof coordinates.lat === 'number'
          ? coordinates
          : { lat: 28.8386, lng: 78.7733 };
    }

    try {
      await reverseGeocodeAndAutofill(detectedCoords, true);
    } finally {
      setIsLocatingUser(false);
    }
  };

  return (
    <div ref={containerWrapperRef} className="space-y-4">
      {/* 1. QUICK SAVED CITIES BAR (FROM MONGODB) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
            <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Select Your City (Uttar Pradesh Priority):</span>
          </label>
          <span className="text-[11px] text-[#6B8077]">Tap to switch city</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {mongoCities.slice(0, 10).map((c) => {
            const isSelected = String(cityText || '').toLowerCase() === String(c.name || '').toLowerCase();
            return (
              <button
                key={c._id || c.slug || c.name}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectMongoCity(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#10231D] text-[#F4EFE6] border-[#10231D] shadow-xs'
                    : 'bg-[#F4EFE6] text-[#3D524A] border-[#E2D9C8] hover:border-[#E9A23B]'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN SEARCH BOX FOR AREA / LANDMARK / MOSQUE / STREET */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-[#10231D] flex items-center gap-1.5">
            <LuSearch className="w-4 h-4 text-[#E9A23B]" />
            <span>Search Street / Area / Landmark:</span>
            <span className="text-[#C2512D]">*</span>
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={disabled || isLocatingUser}
            className="text-[11px] font-bold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1 transition-colors bg-[#ECE5D8] hover:bg-[#E2D9C8] px-2.5 py-1 rounded-lg border border-[#D2C8B8] cursor-pointer"
          >
            {isLocatingUser ? (
              <LuLoader className="w-3 h-3 animate-spin text-[#E9A23B]" />
            ) : (
              <LuNavigation className="w-3 h-3 text-[#E9A23B]" />
            )}
            <span>{isLocatingUser ? 'Autofilling GPS Address...' : 'Locate Me (GPS)'}</span>
          </button>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Type street, area, mosque or landmark in ${cityText || 'Uttar Pradesh'} (e.g. Molsari Masjid, Civil Lines)...`}
              value={streetQuery}
              disabled={disabled}
              onChange={handleStreetInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (predictions.length > 0) {
                    handleSelectPrediction(predictions[0]);
                  } else {
                    handleRefineLocationFromSearch(streetQuery);
                  }
                }
              }}
              onFocus={() => {
                if (predictions.length > 0) setShowPredictions(true);
              }}
              className={`w-full p-3 pl-9 pr-8 rounded-xl border text-sm transition-all ${
                error
                  ? 'border-[#C2512D] bg-[#F9ECE8]'
                  : 'border-[#E2D9C8] bg-[#F4EFE6] focus:border-[#E9A23B] focus:bg-white'
              } focus:outline-none`}
              required
            />
            <LuMapPin className="w-4 h-4 text-[#6B8077] absolute left-3 top-3.5" />
            {isSearching && (
              <LuLoader className="w-4 h-4 text-[#E9A23B] animate-spin absolute right-3 top-3.5" />
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (predictions.length > 0) {
                handleSelectPrediction(predictions[0]);
              } else {
                handleRefineLocationFromSearch(streetQuery);
              }
            }}
            disabled={disabled || !streetQuery.trim()}
            className="px-3.5 py-3 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Show this place on the map"
          >
            <LuSearch className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span className="hidden sm:inline">Find on Map</span>
          </button>
        </div>

        {/* Autocomplete Recommendations Dropdown */}
        {showPredictions && predictions.length > 0 && !disabled && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#E2D9C8] rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 bg-[#F4EFE6] border-b border-[#E2D9C8] text-[10px] font-bold text-[#6B8077] flex items-center justify-between">
              <span>RECOMMENDED PLACES ({cityText?.toUpperCase() || 'UTTAR PRADESH'} FIRST)</span>
              <span>Tap to select</span>
            </div>
            {predictions.map((p, idx) => (
              <button
                key={p.place_id || `${p.description}_${idx}`}
                type="button"
                onClick={() => handleSelectPrediction(p)}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F4EFE6] transition-colors border-b border-[#E2D9C8]/40 last:border-b-0 flex items-start gap-2.5 cursor-pointer"
              >
                <LuMapPin className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-bold text-[#10231D] truncate">
                      {p.structured_formatting?.main_text || p.description}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.isMongoCity && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {p.mongoCityName || p.city || 'Service City'}
                        </span>
                      )}
                      {!p.isMongoCity && p.isUttarPradesh && (
                        <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          UP
                        </span>
                      )}
                      {p.distance_meters != null && (
                        <span className="text-[10px] font-semibold text-[#6B8077] bg-[#ECE5D8] px-1.5 py-0.5 rounded">
                          {p.distance_meters < 1000
                            ? `${Math.round(p.distance_meters)}m`
                            : `${(p.distance_meters / 1000).toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.structured_formatting?.secondary_text && (
                    <p className="text-[11px] text-[#6B8077] truncate mt-0.5">
                      {p.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. EASY HOUSE / FLAT & LANDMARK INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#10231D] mb-1 flex items-center gap-1.5">
            <LuBuilding2 className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>House / Flat No. / Building (Optional):</span>
          </label>
          <input
            type="text"
            placeholder="e.g. House 14, 2nd Floor, Sunshine Colony"
            value={houseOrFlat}
            disabled={disabled}
            onChange={(e) => {
              setHouseOrFlat(e.target.value);
              emitChange({ houseOrFlat: e.target.value });
            }}
            className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs text-[#10231D] focus:border-[#E9A23B] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#10231D] mb-1">
            Nearby Landmark (Optional):
          </label>
          <input
            type="text"
            value={landmark}
            disabled={disabled}
            onChange={(e) => {
              setLandmark(e.target.value);
              emitChange({ landmark: e.target.value });
            }}
            placeholder="e.g. Near Molsari Masjid, Opp Park"
            className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs text-[#10231D] focus:border-[#E9A23B] focus:bg-white focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 4. EDITABLE CITY & PINCODE ROW (AUTO-FILLED BUT UNLOCKED FOR EASY SAVING) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-[#10231D]">
              City <span className="text-[#C2512D]">*</span>
            </label>
            <span className="text-[10px] font-semibold text-emerald-700">Auto-filled (Editable)</span>
          </div>
          <input
            type="text"
            value={cityText || ''}
            disabled={disabled}
            onChange={(e) => {
              const nextC = e.target.value;
              setCityText(nextC);
              const defPin = getDefaultPincodeForCity(nextC, mongoCities);
              if (defPin) setPincode(defPin);
              emitChange({
                cityText: nextC,
                city: nextC,
                ...(defPin ? { pincode: defPin } : {})
              });
            }}
            placeholder="e.g. Moradabad"
            className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs font-semibold text-[#10231D] focus:border-[#E9A23B] focus:bg-white focus:outline-none"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-[#10231D]">
              Pincode <span className="text-[#C2512D]">*</span>
            </label>
            <span className="text-[10px] font-semibold text-emerald-700">Auto-filled (Editable)</span>
          </div>
          <input
            type="text"
            maxLength={6}
            value={pincode || ''}
            disabled={disabled}
            onChange={(e) => {
              const cleanPin = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(cleanPin);
              emitChange({ pincode: cleanPin });
            }}
            placeholder="e.g. 244001"
            className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs font-mono font-bold text-[#10231D] focus:border-[#E9A23B] focus:bg-white focus:outline-none"
            required
          />
        </div>
      </div>

      {/* 5. INTERACTIVE MAP */}
      {mapLoaded ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#10231D] flex items-center gap-1.5">
              <LuCompass className="w-4 h-4 text-[#E9A23B]" />
              <span>Map Location (Optional — Drag pin if needed)</span>
            </span>
          </div>

          {refinementTip && (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <LuCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{refinementTip}</span>
              </span>
              <button
                type="button"
                onClick={() => setRefinementTip('')}
                className="text-[10px] text-emerald-700 underline font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden border border-[#10231D]/15 shadow-sm">
            <div
              ref={mapContainerRef}
              className="w-full h-60 sm:h-72 bg-[#ECE5D8] transition-all"
              style={{ minHeight: '240px' }}
            />
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
              <div className="bg-[#10231D]/90 backdrop-blur-md text-[#F4EFE6] px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 pointer-events-auto">
                <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                <span>Tap map or drag pin to your house</span>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocatingUser}
                className="px-3 py-1 rounded-lg bg-white/95 hover:bg-white text-[#10231D] text-[11px] font-bold shadow-sm border border-[#D2C8B8] flex items-center gap-1 cursor-pointer pointer-events-auto"
              >
                {isLocatingUser ? (
                  <LuLoader className="w-3 h-3 animate-spin text-[#E9A23B]" />
                ) : (
                  <LuNavigation className="w-3 h-3 text-emerald-600" />
                )}
                <span>{isLocatingUser ? 'Finding...' : 'Current Location'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : isLoadingKey ? (
        <div className="p-3 rounded-xl bg-[#ECE5D8]/50 border border-[#D2C8B8] flex items-center gap-2 text-xs text-[#6B8077]">
          <LuLoader className="w-4 h-4 animate-spin text-[#E9A23B]" />
          <span>Loading map...</span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs text-[#3D524A] flex items-center gap-2">
          <LuInfo className="w-4 h-4 text-[#E9A23B] shrink-0" />
          <span>Search and select your area above — your address will be saved automatically.</span>
        </div>
      )}
    </div>
  );
}
