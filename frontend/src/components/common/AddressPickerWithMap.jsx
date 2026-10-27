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
  LuLoader,
  LuLock
} from 'react-icons/lu';
import { loadGoogleMapsScript } from '../../utils/googleMapsLoader';

/**
 * AddressPickerWithMap
 * Premium Address Auto-Complete with separate House/Flat detailing and Interactive Doorstep Pinpoint
 * Cost-optimized with Places Autocomplete Session Tokens, debouncing, and direct GPS geolocation.
 * City and Pincode are strictly auto-filled from map location and locked from manual editing.
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

  // Address fields state
  const [houseOrFlat, setHouseOrFlat] = useState(value.houseOrFlat || '');
  const [streetQuery, setStreetQuery] = useState(value.line1 || value.formattedAddress || '');
  const [landmark, setLandmark] = useState(value.landmark || '');
  const [cityText, setCityText] = useState(value.cityText || value.city || defaultCity);
  const [stateText, setStateText] = useState(value.stateText || value.state || 'Uttar Pradesh');
  const [pincode, setPincode] = useState(value.pincode || '');
  const [coordinates, setCoordinates] = useState(
    value.coordinates && typeof value.coordinates.lat === 'number'
      ? value.coordinates
      : { lat: 28.8389, lng: 78.7768 } // Default Moradabad coordinates
  );

  // Autocomplete prediction state
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [refinementTip, setRefinementTip] = useState('');

  // Google Maps SDK references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal state when prop value changes
  useEffect(() => {
    if (value.houseOrFlat !== undefined && value.houseOrFlat !== houseOrFlat) {
      setHouseOrFlat(value.houseOrFlat || '');
    }
    if (value.line1 && value.line1 !== streetQuery && !showPredictions) {
      setStreetQuery(value.line1 || value.formattedAddress || '');
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
      const merged = {
        houseOrFlat,
        line1: streetQuery,
        formattedAddress: streetQuery,
        landmark,
        cityText,
        city: cityText,
        stateText,
        state: stateText,
        pincode,
        coordinates,
        ...updatedFields
      };
      onChange(merged);
    }
  }, [houseOrFlat, streetQuery, landmark, cityText, stateText, pincode, coordinates, onChange]);

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
    let detectedCity = '';
    let detectedState = '';
    let detectedPincode = '';

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

    if (detectedCity) setCityText(detectedCity);
    if (detectedState) setStateText(detectedState);
    if (detectedPincode) setPincode(detectedPincode);

    if (updateStreet && placeDetails.formatted_address) {
      setStreetQuery(placeDetails.formatted_address);
    }

    return {
      city: detectedCity || cityText,
      state: detectedState || stateText,
      pincode: detectedPincode || pincode
    };
  };

  // Bounce marker briefly to visually confirm pin repositioning
  const triggerPinDropAnimation = () => {
    if (markerInstanceRef.current && window.google?.maps?.Animation) {
      markerInstanceRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        try {
          markerInstanceRef.current?.setAnimation(null);
        } catch (_) {}
      }, 1200);
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

        // Initialize Places Autocomplete service & Session Token
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

  // Initialize Map canvas once SDK is ready and container is mounted
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const google = window.google;
      const initialPos = (coordinates && typeof coordinates.lat === 'number')
        ? coordinates
        : { lat: 28.8389, lng: 78.7768 };

      const map = new google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      });

      // Draggable marker with custom styling
      const marker = new google.maps.Marker({
        position: initialPos,
        map: map,
        draggable: !disabled,
        title: 'Your Doorstep Location (Drag marker to pinpoint exact gate)',
        animation: google.maps.Animation.DROP
      });

      // When customer drags marker to pinpoint exact gate/doorstep
      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        if (newPos) {
          const newCoords = { lat: newPos.lat(), lng: newPos.lng() };
          setCoordinates(newCoords);
          setRefinementTip('Doorstep pinpoint updated! City and pincode locked from map.');

          // Reverse geocode to update locality notes and auto-fill city/pincode
          if (geocoderRef.current) {
            geocoderRef.current.geocode({ location: newCoords }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                const comps = extractFromGeocodeResults(results);
                if (comps.city) setCityText(comps.city);
                if (comps.state) setStateText(comps.state);
                if (comps.pincode) setPincode(comps.pincode);

                emitChange({
                  coordinates: newCoords,
                  cityText: comps.city || cityText,
                  city: comps.city || cityText,
                  stateText: comps.state || stateText,
                  state: comps.state || stateText,
                  pincode: comps.pincode || pincode,
                  formattedAddress: results[0]?.formatted_address || streetQuery
                });
              } else {
                emitChange({ coordinates: newCoords });
              }
            });
          } else {
            emitChange({ coordinates: newCoords });
          }
        }
      });

      // Map click also moves the pin
      map.addListener('click', (e) => {
        if (disabled) return;
        const newCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(newCoords);
        setCoordinates(newCoords);
        setRefinementTip('Doorstep pinpoint updated! City and pincode locked from map.');

        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: newCoords }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const comps = extractFromGeocodeResults(results);
              if (comps.city) setCityText(comps.city);
              if (comps.state) setStateText(comps.state);
              if (comps.pincode) setPincode(comps.pincode);

              emitChange({
                coordinates: newCoords,
                cityText: comps.city || cityText,
                city: comps.city || cityText,
                stateText: comps.state || stateText,
                state: comps.state || stateText,
                pincode: comps.pincode || pincode,
                formattedAddress: results[0]?.formatted_address || streetQuery
              });
            } else {
              emitChange({ coordinates: newCoords });
            }
          });
        } else {
          emitChange({ coordinates: newCoords });
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

  // Pre-fill city & pincode from coordinates on initial load if not yet populated
  useEffect(() => {
    if (!mapLoaded || !geocoderRef.current) return;
    if (coordinates && coordinates.lat && coordinates.lng && (!pincode || !cityText)) {
      geocoderRef.current.geocode({ location: coordinates }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const comps = extractFromGeocodeResults(results);
          if (comps.city && !cityText) setCityText(comps.city);
          if (comps.state && !stateText) setStateText(comps.state);
          if (comps.pincode && !pincode) setPincode(comps.pincode);

          emitChange({
            cityText: comps.city || cityText,
            city: comps.city || cityText,
            stateText: comps.state || stateText,
            state: comps.state || stateText,
            pincode: comps.pincode || pincode
          });
        }
      });
    }
  }, [mapLoaded]);

  // Live geocoding API fallback over the network (zero static/seeded data)
  const fetchLiveGeocodingApi = async (query, refLat, refLng) => {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${refLat}&lon=${refLng}&limit=8`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const mapped = data.features.map((f, idx) => {
            const p = f.properties;
            const [fLng, fLat] = f.geometry?.coordinates || [refLng, refLat];

            // Haversine straight-line distance in meters from current coordinates
            const dLat = (fLat - refLat) * (Math.PI / 180);
            const dLon = (fLng - refLng) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(refLat * (Math.PI / 180)) *
                Math.cos(fLat * (Math.PI / 180)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const distKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
            const distMeters = Math.round(distKm * 1000);

            const mainText = p.name || p.street || query;
            const parts = [p.street, p.district, p.city, p.state, p.country].filter(Boolean);
            const secondaryText = parts.slice(0, 3).join(', ');

            return {
              place_id: `api_${idx}_${p.osm_id || idx}`,
              description: `${mainText}${secondaryText ? ', ' + secondaryText : ''}`,
              distance_meters: distMeters,
              geometry: {
                location: {
                  lat: () => fLat,
                  lng: () => fLng
                }
              },
              address_components: [
                { types: ['locality'], long_name: p.city || p.district || '' },
                { types: ['administrative_area_level_1'], long_name: p.state || '' },
                { types: ['postal_code'], long_name: p.postcode || '' }
              ],
              structured_formatting: {
                main_text: mainText,
                secondary_text: secondaryText || p.city || ''
              }
            };
          });

          mapped.sort((a, b) => a.distance_meters - b.distance_meters);
          setPredictions(mapped.slice(0, 8));
          setShowPredictions(true);
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[Live Geocoding API Error]:', err);
    }

    setIsSearching(false);
    setPredictions([]);
    setShowPredictions(false);
  };

  // Debounced search dynamically fetched via live APIs (Google Places API + Live Geocoding API)
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

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);

      const refLat = coordinates?.lat || 28.8389;
      const refLng = coordinates?.lng || 78.7768;

      // 1. Try Google Places Autocomplete API if initialized
      if (autocompleteServiceRef.current && !disabled) {
        const request = {
          input: query,
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
              radius: 40000
            });
          } catch (_) {}
        }

        autocompleteServiceRef.current.getPlacePredictions(
          request,
          async (results, status) => {
            const isOk = window.google?.maps?.places?.PlacesServiceStatus?.OK;

            if (status === isOk && results && results.length > 0) {
              setIsSearching(false);
              const sorted = [...results].sort((a, b) => {
                if (a.distance_meters != null && b.distance_meters != null) {
                  return a.distance_meters - b.distance_meters;
                }
                return 0;
              });
              setPredictions(sorted.slice(0, 8));
              setShowPredictions(true);
              return;
            }

            // 2. If Google Places returned REQUEST_DENIED or ZERO_RESULTS, fetch live from online API
            console.warn('[Google Places API status]:', status, '- querying live geocoding API over network');
            await fetchLiveGeocodingApi(query, refLat, refLng);
          }
        );
        return;
      }

      // If Google AutocompleteService is not available, query live geocoding API directly
      await fetchLiveGeocodingApi(query, refLat, refLng);
    }, 300);
  };

  // Refine pinpoint directly using search text via Google Geocoder
  const handleRefineLocationFromSearch = (searchText = streetQuery) => {
    const query = (searchText || '').trim();
    if (!query) return;

    setShowPredictions(false);
    setIsSearching(true);

    if (geocoderRef.current) {
      const fullSearchAddress = cityText && !query.toLowerCase().includes(cityText.toLowerCase())
        ? `${query}, ${cityText}`
        : query;

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
                line1: best.formatted_address || query,
                city: comps.city || cityText,
                state: comps.state || stateText,
                pincode: comps.pincode || pincode
              });
            }
          }
        }
      );
    } else {
      setIsSearching(false);
    }
  };

  // Helper to reposition map, bounce pin, update coords and auto-fill city/pincode
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

    const newCity = meta.city || cityText;
    const newState = meta.state || stateText;
    const newPincode = meta.pincode || pincode;
    const newLine1 = meta.line1 || streetQuery;

    if (newCity) setCityText(newCity);
    if (newState) setStateText(newState);
    if (newPincode) setPincode(newPincode);
    if (newLine1) setStreetQuery(newLine1);

    setRefinementTip(`Pinpoint refined to ${newCity} (${newPincode})! Drag marker on map to adjust exact gate.`);

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

  // When user selects a prediction from the dropdown
  const handleSelectPrediction = (prediction) => {
    setShowPredictions(false);
    setStreetQuery(prediction.description);

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
        line1: prediction.description,
        city: comps.city,
        state: comps.state,
        pincode: comps.pincode
      });
      return;
    }

    if (!placesServiceRef.current || !prediction.place_id) {
      handleRefineLocationFromSearch(prediction.description);
      return;
    }

    setIsSearching(true);
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'address_components', 'place_id'],
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

          const comps = extractAddressComponents(place, true);

          // If place details had no pincode, geocoder retrieves postal code for this lat/lng
          if (!comps.pincode && geocoderRef.current) {
            geocoderRef.current.geocode({ location: newCoords }, (geoResults, geoStatus) => {
              const geoComps = (geoStatus === 'OK' && geoResults) ? extractFromGeocodeResults(geoResults) : {};
              applyLocationCoordinates(newCoords, {
                line1: place.formatted_address || prediction.description,
                city: geoComps.city || comps.city,
                state: geoComps.state || comps.state,
                pincode: geoComps.pincode || comps.pincode
              });
            });
          } else {
            applyLocationCoordinates(newCoords, {
              line1: place.formatted_address || prediction.description,
              city: comps.city,
              state: comps.state,
              pincode: comps.pincode
            });
          }
        }
      }
    );
  };

  // "Use My Current Location" via Browser Geolocation (Free device GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const newCoords = { lat, lng };

        setIsLocatingUser(false);

        // Reverse geocode to get street name & auto-fill city/pincode
        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: newCoords }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const bestResult = results[0];
              const comps = extractFromGeocodeResults(results);
              applyLocationCoordinates(newCoords, {
                line1: bestResult.formatted_address,
                city: comps.city || cityText,
                state: comps.state || stateText,
                pincode: comps.pincode || pincode
              });
            } else {
              applyLocationCoordinates(newCoords, { line1: streetQuery });
            }
          });
        } else {
          applyLocationCoordinates(newCoords, { line1: streetQuery });
        }
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Geolocation error:', err.message);
        alert('Could not retrieve your location. Please ensure location permissions are allowed in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. SEPARATE DETAILED ADDRESS INPUT: House / Flat / Floor / Building */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-[#10231D] flex items-center gap-1.5">
            <LuBuilding2 className="w-4 h-4 text-[#E9A23B]" />
            <span>Flat / House No. / Floor / Building / Society:</span>
            <span className="text-[#C2512D]">*</span>
          </label>
        </div>
        <input
          type="text"
          placeholder="e.g. Flat 402, Tower B, 4th Floor, Palm Greens Society"
          value={houseOrFlat}
          disabled={disabled}
          onChange={(e) => {
            setHouseOrFlat(e.target.value);
            emitChange({ houseOrFlat: e.target.value });
          }}
          className="w-full p-3 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-sm text-[#10231D] focus:border-[#E9A23B] focus:bg-white focus:outline-none transition-all placeholder:text-[#6B8077]/60"
          required
        />
        <p className="text-[11px] text-[#6B8077] mt-1 flex items-center gap-1">
          <LuInfo className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
          <span>Enter door/unit details above. Search street or area below to refine your pinpoint.</span>
        </p>
      </div>

      {/* 2. SEARCH STREET / AREA / LANDMARK TO REFINE PINPOINT */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-[#10231D] flex items-center gap-1.5">
            <LuSearch className="w-4 h-4 text-[#E9A23B]" />
            <span>Search Street / Area / Landmark:</span>
            <span className="text-[#C2512D]">*</span>
          </label>
          {mapLoaded && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={disabled || isLocatingUser}
              className="text-[11px] font-bold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1 transition-colors bg-[#ECE5D8] hover:bg-[#E2D9C8] px-2 py-0.5 rounded-lg border border-[#D2C8B8] cursor-pointer"
            >
              {isLocatingUser ? (
                <LuLoader className="w-3 h-3 animate-spin text-[#E9A23B]" />
              ) : (
                <LuNavigation className="w-3 h-3 text-[#E9A23B]" />
              )}
              <span>Locate Me (GPS)</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Type street, road, society or landmark (e.g. Wave Mall, Kanth Road, Civil Lines)..."
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
            title="Refine map pinpoint to this location"
          >
            <LuSearch className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span className="hidden sm:inline">Refine Pin</span>
          </button>
        </div>

        {/* Autocomplete Predictions Dropdown */}
        {showPredictions && predictions.length > 0 && !disabled && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#E2D9C8] rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            <div className="px-3 py-1.5 bg-[#F4EFE6] border-b border-[#E2D9C8] text-[10px] font-bold text-[#6B8077] flex items-center justify-between">
              <span>SUGGESTED AREAS & LANDMARKS</span>
              <span>Nearest locations shown first</span>
            </div>
            {predictions.map((p) => (
              <button
                key={p.place_id || p.description}
                type="button"
                onClick={() => handleSelectPrediction(p)}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F4EFE6] transition-colors border-b border-[#E2D9C8]/40 last:border-b-0 flex items-start gap-2.5 cursor-pointer"
              >
                <LuMapPin className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#10231D] truncate">
                      {p.structured_formatting?.main_text || p.description}
                    </p>
                    {p.distance_meters != null && (
                      <span className="text-[10px] font-semibold text-[#6B8077] bg-[#ECE5D8] px-1.5 py-0.5 rounded shrink-0">
                        {p.distance_meters < 1000
                          ? `${Math.round(p.distance_meters)}m away`
                          : `${(p.distance_meters / 1000).toFixed(1)} km away`}
                      </span>
                    )}
                  </div>
                  {p.structured_formatting?.secondary_text && (
                    <p className="text-[11px] text-[#6B8077] truncate">
                      {p.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE PINPOINT MAP */}
      {mapLoaded ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#10231D] flex items-center gap-1.5">
              <LuCompass className="w-4 h-4 text-[#E9A23B]" />
              <span>Doorstep Map Pinpoint</span>
            </span>
            <span className="text-[11px] text-[#6B8077]">
              Drag marker or tap map to adjust exact gate
            </span>
          </div>

          {/* Real-time refinement feedback banner */}
          {refinementTip && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <LuCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{refinementTip}</span>
              </span>
              <button
                type="button"
                onClick={() => setRefinementTip('')}
                className="text-[10px] text-emerald-700 underline font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden border border-[#E2D9C8] shadow-xs">
            <div
              ref={mapContainerRef}
              className="w-full h-52 sm:h-64 bg-[#ECE5D8]"
              style={{ minHeight: '220px' }}
            />
            <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
              <div className="bg-[#10231D]/90 backdrop-blur-md text-[#F4EFE6] px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <span>Pin: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</span>
                </span>
                <span className="text-[#E9A23B] font-bold">Doorstep Verified</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#6B8077] flex items-center gap-1.5">
            <LuInfo className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
            <span>Search above to position pin near your colony, then drag marker for exact gate/doorstep accuracy.</span>
          </p>
        </div>
      ) : isLoadingKey ? (
        <div className="p-4 rounded-xl bg-[#ECE5D8]/50 border border-[#D2C8B8] flex items-center gap-2 text-xs text-[#6B8077]">
          <LuLoader className="w-4 h-4 animate-spin text-[#E9A23B]" />
          <span>Connecting to map services...</span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#F9ECE8] border border-[#C2512D]/30 text-xs text-[#3D524A] flex items-center gap-2">
          <LuCircleAlert className="w-4 h-4 text-[#C2512D] shrink-0" />
          <span>Interactive map unavailable: {mapError || 'Using local verified address directory.'}</span>
        </div>
      )}

      {/* 4. CITY, LANDMARK & PINCODE COMPACT ROW - CITY & PINCODE LOCKED TO MAP LOCATION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* CITY: LOCKED / AUTO-FILLED FROM LOCATION */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-[#10231D] flex items-center gap-1">
              <LuLock className="w-3 h-3 text-[#6B8077]" />
              <span>City:</span>
              <span className="text-[#C2512D]">*</span>
            </label>
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
              Auto-Filled
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={cityText || ''}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              placeholder="Auto-detected from map"
              className="w-full p-2.5 pl-8 rounded-xl border border-[#D2C8B8] bg-[#ECE5D8]/80 text-xs font-semibold text-[#10231D] cursor-not-allowed select-none focus:outline-none"
              required
            />
            <LuLock className="w-3.5 h-3.5 text-[#6B8077] absolute left-2.5 top-3" />
          </div>
          <p className="text-[10px] text-[#6B8077] mt-0.5">
            Auto-detected from map pin.
          </p>
        </div>

        {/* LANDMARK: OPTIONAL CUSTOM ENTRY FOR CREW GUIDANCE */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-[#10231D]">
              Landmark (Optional):
            </label>
            <span className="text-[10px] text-[#6B8077]">Helpful guide</span>
          </div>
          <input
            type="text"
            value={landmark}
            disabled={disabled}
            onChange={(e) => {
              setLandmark(e.target.value);
              emitChange({ landmark: e.target.value });
            }}
            placeholder="e.g. Near Water Tank, Opp Gate 2"
            className="w-full p-2.5 rounded-xl border border-[#E2D9C8] bg-[#F4EFE6] text-xs text-[#10231D] focus:border-[#E9A23B] focus:bg-white focus:outline-none"
          />
          <p className="text-[10px] text-[#6B8077] mt-0.5">
            Helpful guide for crew arrival.
          </p>
        </div>

        {/* PINCODE: LOCKED / AUTO-FILLED FROM LOCATION */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-[#10231D] flex items-center gap-1">
              <LuLock className="w-3 h-3 text-[#6B8077]" />
              <span>Pincode:</span>
              <span className="text-[#C2512D]">*</span>
            </label>
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
              Auto-Filled
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={pincode || ''}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              placeholder="Auto-detected from map"
              className="w-full p-2.5 pl-8 rounded-xl border border-[#D2C8B8] bg-[#ECE5D8]/80 text-xs font-mono font-bold text-[#10231D] cursor-not-allowed select-none focus:outline-none"
              required
            />
            <LuLock className="w-3.5 h-3.5 text-[#6B8077] absolute left-2.5 top-3" />
          </div>
          <p className="text-[10px] text-[#6B8077] mt-0.5">
            Auto-detected from map pin.
          </p>
        </div>
      </div>
    </div>
  );
}
