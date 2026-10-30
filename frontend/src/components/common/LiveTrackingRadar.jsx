import React, { useState, useEffect, useRef } from 'react';
import {
  LuNavigation,
  LuMapPin,
  LuClock,
  LuShieldCheck,
  LuCompass,
  LuExternalLink,
  LuPhone,
  LuUser,
  LuCircleCheck,
  LuLayers,
  LuEye
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { loadGoogleMapsScript } from '../../utils/googleMapsLoader';
import { calculateDistanceKm, getEtaInfo } from '../../utils/geoUtils';

/**
 * LiveTrackingRadar
 * Interactive Real-Time Map showing Supervisor Live Vehicle Location & Customer Doorstep Pin.
 * Displays live Uber/Rapido-style distance and ETA calculated client-side with Zero ($0.00) Google API fees.
 */
const PLACEHOLDER_SUPERVISOR_NAMES = new Set([
  'field supervisor',
  'assigned lead',
  'assigned lead supervisor',
  'not assigned',
  'unassigned',
  'pending'
]);

function isGenuineSupervisor(sup) {
  if (!sup) return false;
  if (sup.id || sup._id) return true;
  const cleanName = String(sup.name || '').trim().toLowerCase();
  return Boolean(cleanName && !PLACEHOLDER_SUPERVISOR_NAMES.has(cleanName));
}

export default function LiveTrackingRadar({
  bookingCode,
  initialSupervisorLocation = null,
  customerLocation = null,
  destinationAddress = '',
  supervisorInfo = null,
  isSupervisorAssigned: initialAssignedProp = undefined,
  pollIntervalMs = 3000
}) {
  const initialHasSupervisor =
    typeof initialAssignedProp === 'boolean'
      ? initialAssignedProp
      : isGenuineSupervisor(supervisorInfo);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasSupervisor, setHasSupervisor] = useState(initialHasSupervisor);
  const [liveLocation, setLiveLocation] = useState(
    initialHasSupervisor && initialSupervisorLocation?.lat ? initialSupervisorLocation : null
  );
  const [isSharing, setIsSharing] = useState(
    Boolean(initialHasSupervisor && (initialSupervisorLocation?.isSharing !== false))
  );
  const [lastUpdated, setLastUpdated] = useState(
    initialSupervisorLocation?.updatedAt ? new Date(initialSupervisorLocation.updatedAt) : new Date()
  );
  const [resolvedCustomerLoc, setResolvedCustomerLoc] = useState(customerLocation);
  const [resolvedSupervisor, setResolvedSupervisor] = useState(
    initialHasSupervisor && isGenuineSupervisor(supervisorInfo) ? supervisorInfo : null
  );
  const [distanceKm, setDistanceKm] = useState(null);
  const [mapViewMode, setMapViewMode] = useState('roadmap'); // 'roadmap' | 'hybrid' | 'streetview'
  const [streetViewNotice, setStreetViewNotice] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const supervisorMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routePolylineRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Helper to draw or update real driving route line following actual roads
  const updateRouteLine = (start, end) => {
    if (!start || !end || !window.google?.maps || !mapInstanceRef.current) return;
    const google = window.google;

    const startPos = { lat: Number(start.lat), lng: Number(start.lng) };
    const endPos = { lat: Number(end.lat), lng: Number(end.lng) };

    // Fetch and render real turn-by-turn road route immediately
    fetchRoadDrivingRoute(startPos, endPos);

    // Also attempt Google Directions if active and supported
    if (google.maps.DirectionsService && google.maps.DirectionsRenderer) {
      try {
        const ds = new google.maps.DirectionsService();
        ds.route(
          {
            origin: startPos,
            destination: endPos,
            travelMode: google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              if (!directionsRendererRef.current) {
                directionsRendererRef.current = new google.maps.DirectionsRenderer({
                  map: mapInstanceRef.current,
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#E9A23B',
                    strokeWeight: 5,
                    strokeOpacity: 0.95
                  }
                });
              } else {
                directionsRendererRef.current.setMap(mapInstanceRef.current);
              }
              directionsRendererRef.current.setDirections(result);
              if (routePolylineRef.current) {
                routePolylineRef.current.setMap(null);
              }
            }
          }
        );
      } catch (err) {
        // Fallback already rendered by fetchRoadDrivingRoute
      }
    }
  };

  const fetchRoadDrivingRoute = async (startPos, endPos) => {
    if (!window.google?.maps || !mapInstanceRef.current) return;
    const google = window.google;

    const renderRoadPolyline = (roadPoints, distKm) => {
      if (!roadPoints?.length || !mapInstanceRef.current) return;

      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }

      routePolylineRef.current = new google.maps.Polyline({
        path: roadPoints,
        geodesic: true,
        strokeColor: '#E9A23B',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map: mapInstanceRef.current
      });

      // Fit map viewport to show the real road route
      const bounds = new google.maps.LatLngBounds();
      roadPoints.forEach((pt) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });

      if (distKm && typeof distKm === 'number') {
        setDistanceKm(distKm);
      }
    };

    // 1. Try Backend Road Route Service (Fast, cached, server-to-server)
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
      const backendUrl = `${apiBase}/locations/route?startLat=${startPos.lat}&startLng=${startPos.lng}&endLat=${endPos.lat}&endLng=${endPos.lng}`;
      const res = await fetch(backendUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.coordinates?.length) {
          renderRoadPolyline(data.coordinates, data.distanceKm);
          return;
        }
      }
    } catch (err) {
      // Fallback to client-side mirrors
    }

    // 2. Direct client-side road engines (OSRM & OpenStreetMap mirrors)
    const directEngines = [
      `https://router.project-osrm.org/route/v1/driving/${startPos.lng},${startPos.lat};${endPos.lng},${endPos.lat}?overview=full&geometries=geojson`,
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startPos.lng},${startPos.lat};${endPos.lng},${endPos.lat}?overview=full&geometries=geojson`
    ];

    for (const url of directEngines) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length) {
            const roadPoints = data.routes[0].geometry.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0]
            }));
            const distKm = data.routes[0].distance ? Number((data.routes[0].distance / 1000).toFixed(1)) : null;
            renderRoadPolyline(roadPoints, distKm);
            return;
          }
        }
      } catch (err) {
        // Continue to next routing mirror
      }
    }

    // Fallback: If road engines are unreachable, render direct route path so supervisor, admin and user ALWAYS see route, distance and ETA
    const fallbackDist = calculateDistanceKm(startPos.lat, startPos.lng, endPos.lat, endPos.lng);
    renderRoadPolyline([startPos, endPos], fallbackDist);
  };

  // Sync prop changes
  useEffect(() => {
    if (customerLocation && (!resolvedCustomerLoc || customerLocation.lat !== resolvedCustomerLoc.lat)) {
      setResolvedCustomerLoc(customerLocation);
    }
  }, [customerLocation]);

  useEffect(() => {
    const propAssigned =
      typeof initialAssignedProp === 'boolean'
        ? initialAssignedProp
        : isGenuineSupervisor(supervisorInfo);
    setHasSupervisor(propAssigned);
    if (propAssigned && isGenuineSupervisor(supervisorInfo)) {
      setResolvedSupervisor(supervisorInfo);
    } else if (!propAssigned) {
      setResolvedSupervisor(null);
      setIsSharing(false);
    }
  }, [supervisorInfo, initialAssignedProp]);

  // Poll live location endpoint
  const fetchLiveLocation = async () => {
    if (!bookingCode || document.hidden) return;

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/bookings/${encodeURIComponent(bookingCode)}/live-location`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const assigned =
            typeof data.isSupervisorAssigned === 'boolean'
              ? data.isSupervisorAssigned
              : isGenuineSupervisor(data.supervisor);

          setHasSupervisor(assigned);
          setIsSharing(Boolean(assigned && (data.isSharing ?? true)));

          if (data.customerLocation) {
            setResolvedCustomerLoc(data.customerLocation);
          }

          if (assigned && data.supervisor) {
            setResolvedSupervisor((prev) => ({ ...(prev || {}), ...data.supervisor }));
          } else if (!assigned) {
            setResolvedSupervisor(null);
            setLiveLocation(null);
            setDistanceKm(null);
            if (supervisorMarkerRef.current) {
              supervisorMarkerRef.current.setVisible(false);
            }
            if (routePolylineRef.current) {
              routePolylineRef.current.setMap(null);
            }
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setMap(null);
            }
          }

          if (assigned && data.supervisorLocation) {
            setLiveLocation(data.supervisorLocation);
            setLastUpdated(new Date(data.supervisorLocation.updatedAt || Date.now()));

            // Update in-memory map marker position without re-rendering map
            if (supervisorMarkerRef.current) {
              const newPos = {
                lat: data.supervisorLocation.lat,
                lng: data.supervisorLocation.lng
              };
              supervisorMarkerRef.current.setPosition(newPos);
              supervisorMarkerRef.current.setVisible(true);
              if (resolvedCustomerLoc || customerLocation) {
                updateRouteLine(newPos, resolvedCustomerLoc || customerLocation);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[LiveTrackingRadar] Polling notice:', err.message);
    }
  };

  // Visibility and polling lifecycle
  useEffect(() => {
    if (!bookingCode) return;

    fetchLiveLocation();
    pollTimerRef.current = setInterval(fetchLiveLocation, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLiveLocation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [bookingCode, pollIntervalMs]);

  // Calculate distance between supervisor and customer doorstep (Zero Google API costs)
  useEffect(() => {
    const cust = resolvedCustomerLoc || customerLocation;
    const sup = liveLocation || initialSupervisorLocation;
    if (hasSupervisor && cust?.lat && sup?.lat) {
      const dist = calculateDistanceKm(
        cust.lat,
        cust.lng,
        sup.lat,
        sup.lng
      );
      setDistanceKm(dist);
    } else if (!hasSupervisor) {
      setDistanceKm(null);
    }
  }, [hasSupervisor, resolvedCustomerLoc, customerLocation, liveLocation, initialSupervisorLocation]);

  const etaInfo = hasSupervisor ? getEtaInfo(distanceKm) : null;

  // Load Google Maps SDK
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript()
      .then(() => {
        if (isMounted) setMapLoaded(true);
      })
      .catch((err) => {
        console.warn('[LiveTrackingRadar] Maps SDK unavailable:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Map canvas once SDK & container are ready
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const google = window.google;
      const cust = resolvedCustomerLoc || customerLocation;

      const custPos =
        cust && typeof cust.lat === 'number'
          ? cust
          : { lat: 28.8389, lng: 78.7768 };

      const hasSupCoords = hasSupervisor && liveLocation && typeof liveLocation.lat === 'number';
      const supPos = hasSupCoords ? liveLocation : custPos;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: hasSupCoords ? supPos : custPos,
        zoom: 15,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      });

      const panorama = map.getStreetView();
      if (panorama) {
        panorama.addListener('visible_changed', () => {
          if (panorama.getVisible()) {
            setMapViewMode('streetview');
          } else {
            setMapViewMode((prev) => (prev === 'streetview' ? (map.getMapTypeId() || 'roadmap') : prev));
          }
        });
      }

      // Customer Doorstep Marker (Gold Pin)
      const custMarker = new google.maps.Marker({
        position: custPos,
        map: map,
        title: 'Customer Doorstep (Destination)',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#10231D',
          fillOpacity: 1,
          strokeColor: '#E9A23B',
          strokeWeight: 3.5
        }
      });

      // Supervisor Vehicle / Moving Crew Marker (Moving Gold Forward Arrow)
      const supMarker = new google.maps.Marker({
        position: supPos,
        map: map,
        visible: Boolean(hasSupCoords),
        title: `${resolvedSupervisor?.name || 'Supervisor'} (Live Position)`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6.5,
          fillColor: '#E9A23B',
          fillOpacity: 1,
          strokeColor: '#10231D',
          strokeWeight: 2,
          rotation: liveLocation?.heading || 0
        }
      });

      mapInstanceRef.current = map;
      customerMarkerRef.current = custMarker;
      supervisorMarkerRef.current = supMarker;

      // Draw Route Line between Supervisor and Customer Doorstep only when supervisor is assigned & has coords
      if (hasSupCoords && cust) {
        updateRouteLine(supPos, custPos);
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(custPos);
        bounds.extend(supPos);
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    } catch (err) {
      console.warn('[LiveTrackingRadar] Map canvas error:', err);
    }
  }, [mapLoaded, resolvedCustomerLoc, customerLocation, liveLocation, hasSupervisor]);

  // Keep supervisor marker visibility synced with assignment state
  useEffect(() => {
    if (supervisorMarkerRef.current) {
      const showMarker = Boolean(hasSupervisor && liveLocation && typeof liveLocation.lat === 'number');
      supervisorMarkerRef.current.setVisible(showMarker);
    }
  }, [hasSupervisor, liveLocation]);

  const handleRecenterSupervisor = () => {
    if (mapInstanceRef.current && hasSupervisor && liveLocation?.lat) {
      const pano = mapInstanceRef.current.getStreetView?.();
      if (pano?.getVisible()) pano.setVisible(false);
      mapInstanceRef.current.panTo({ lat: liveLocation.lat, lng: liveLocation.lng });
      mapInstanceRef.current.setZoom(16);
    }
  };

  const handleRecenterDestination = () => {
    const cust = resolvedCustomerLoc || customerLocation;
    if (mapInstanceRef.current && cust?.lat) {
      const pano = mapInstanceRef.current.getStreetView?.();
      if (pano?.getVisible()) pano.setVisible(false);
      mapInstanceRef.current.panTo({ lat: cust.lat, lng: cust.lng });
      mapInstanceRef.current.setZoom(16);
    }
  };

  const handleFitRoute = () => {
    const cust = resolvedCustomerLoc || customerLocation;
    if (mapInstanceRef.current && hasSupervisor && cust?.lat && liveLocation?.lat && window.google?.maps) {
      const pano = mapInstanceRef.current.getStreetView?.();
      if (pano?.getVisible()) pano.setVisible(false);
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(cust);
      bounds.extend(liveLocation);
      mapInstanceRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  };

  const handleSelectMapType = (type) => {
    setStreetViewNotice('');
    if (!mapInstanceRef.current) return;
    const pano = mapInstanceRef.current.getStreetView?.();
    if (pano?.getVisible()) {
      pano.setVisible(false);
    }
    mapInstanceRef.current.setMapTypeId(type);
    setMapViewMode(type);
  };

  const handleToggleStreetView = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const google = window.google;
    const pano = mapInstanceRef.current.getStreetView?.();

    if (pano?.getVisible()) {
      pano.setVisible(false);
      const currentType = mapInstanceRef.current.getMapTypeId() || 'roadmap';
      setMapViewMode(currentType);
      setStreetViewNotice('');
      return;
    }

    const cust = resolvedCustomerLoc || customerLocation;
    const targetPoint =
      (hasSupervisor && liveLocation && typeof liveLocation.lat === 'number'
        ? { lat: Number(liveLocation.lat), lng: Number(liveLocation.lng) }
        : null) ||
      (cust && typeof cust.lat === 'number'
        ? { lat: Number(cust.lat), lng: Number(cust.lng) }
        : { lat: 28.8389, lng: 78.7768 });

    if (google.maps.StreetViewService && pano) {
      const svService = new google.maps.StreetViewService();
      svService.getPanorama(
        { location: targetPoint, radius: 250 },
        (data, status) => {
          if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
            pano.setPosition(data.location.latLng);
            pano.setPov({ heading: liveLocation?.heading || 0, pitch: 0 });
            pano.setVisible(true);
            setMapViewMode('streetview');
            setStreetViewNotice('');
          } else {
            // If 360° panorama isn't captured on this exact residential lane, switch to high-detail 3D Satellite View & show notice
            mapInstanceRef.current.setMapTypeId('hybrid');
            mapInstanceRef.current.panTo(targetPoint);
            mapInstanceRef.current.setZoom(19);
            setMapViewMode('hybrid');
            setStreetViewNotice('360° Street View imagery is not available on this exact lane — switched to close-up Satellite View.');
            setTimeout(() => setStreetViewNotice(''), 5500);
          }
        }
      );
    }
  };

  const targetCoords = resolvedCustomerLoc || customerLocation;
  const navUrl = (targetCoords?.lat && targetCoords?.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetCoords.lat},${targetCoords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress || 'Moradabad')}`;

  const currentSupervisor = hasSupervisor ? (resolvedSupervisor || (isGenuineSupervisor(supervisorInfo) ? supervisorInfo : null)) : null;

  return (
    <div className="bg-[#10231D] text-[#F4EFE6] rounded-3xl border-2 border-[#2D453B] overflow-hidden shadow-2xl">
      {/* Smart Header: Checks if Supervisor is Assigned First */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D453B]/70 bg-[#0C1B16]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className={`w-3.5 h-3.5 rounded-full block ${
                !hasSupervisor
                  ? 'bg-[#E9A23B]'
                  : 'bg-[#25D366]'
              }`}
            />
            {hasSupervisor && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] absolute inset-0 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E9A23B]">
                {!hasSupervisor
                  ? 'SUPERVISOR NOT YET ASSIGNED'
                  : 'LIVE LOCATION & ROUTE'}
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  !hasSupervisor
                    ? 'bg-amber-950/90 text-[#E9A23B] border border-[#E9A23B]/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                {!hasSupervisor ? 'Not Assigned Yet' : 'Sharing On'}
              </span>
            </div>
            <p className="text-xs text-[#A3B8B0] mt-0.5">
              {!hasSupervisor
                ? `Field supervisor not yet assigned to your visit · Ref: #${bookingCode}`
                : etaInfo
                  ? `${etaInfo.statusText} · Ref: #${bookingCode}`
                  : `Supervisor en route to your address · Ref: #${bookingCode}`}
            </p>
          </div>
        </div>

        {/* Uber/Rapido Distance & ETA Pill (Always when Supervisor is Assigned & Distance is calculated) */}
        <div className="flex items-center gap-2.5">
          {hasSupervisor && distanceKm !== null && etaInfo && (
            <div className="px-4 py-2 rounded-2xl bg-[#2D453B]/90 border border-[#3E5C4F] flex items-center gap-3.5 shadow-sm">
              <div>
                <span className="text-[9px] text-[#A3B8B0] block uppercase font-mono font-bold">Distance</span>
                <span className="text-xs sm:text-sm font-black text-[#E9A23B] tnum">{etaInfo.distanceText}</span>
              </div>
              <div className="border-l border-[#3E5C4F] pl-3">
                <span className="text-[9px] text-[#A3B8B0] block uppercase font-mono font-bold">ETA</span>
                <span className="text-xs sm:text-sm font-black text-emerald-300 tnum">{etaInfo.etaText}</span>
              </div>
            </div>
          )}

          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-2xl bg-[#E9A23B] hover:bg-[#d4902f] text-[#10231D] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Open Maps</span>
            <LuExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Map Canvas with Large Responsive Height and Floating Controls */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-[390px] md:h-[430px] bg-[#E5EAE7] transition-all"
          style={{ minHeight: '300px' }}
        />

        {/* Floating Map View Mode Switcher: Original Map / Satellite / Street View */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 p-1 rounded-xl bg-[#10231D]/95 backdrop-blur-md border border-[#2D453B] shadow-lg">
          <button
            type="button"
            onClick={() => handleSelectMapType('roadmap')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              mapViewMode === 'roadmap'
                ? 'bg-[#E9A23B] text-[#10231D] shadow-xs'
                : 'text-[#F4EFE6] hover:bg-[#2D453B]'
            }`}
            title="Original Google Map View"
          >
            <LuLayers className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectMapType('hybrid')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              mapViewMode === 'hybrid'
                ? 'bg-[#E9A23B] text-[#10231D] shadow-xs'
                : 'text-[#F4EFE6] hover:bg-[#2D453B]'
            }`}
            title="Satellite View with Labels"
          >
            <LuCompass className="w-3.5 h-3.5" />
            <span>Sat View</span>
          </button>
          <button
            type="button"
            onClick={handleToggleStreetView}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              mapViewMode === 'streetview'
                ? 'bg-[#E9A23B] text-[#10231D] shadow-xs'
                : 'text-[#F4EFE6] hover:bg-[#2D453B]'
            }`}
            title="Toggle 360° Street View"
          >
            <LuEye className="w-3.5 h-3.5" />
            <span>{mapViewMode === 'streetview' ? 'Exit Street View' : 'Street View'}</span>
          </button>
        </div>

        {/* Street View Fallback Notice */}
        {streetViewNotice && (
          <div className="absolute bottom-14 left-3 right-3 sm:right-auto sm:max-w-md z-10 pointer-events-none">
            <div className="bg-[#10231D]/95 backdrop-blur-md text-[#F4EFE6] border border-[#E9A23B]/60 px-3.5 py-2 rounded-xl text-[11px] font-medium shadow-lg">
              {streetViewNotice}
            </div>
          </div>
        )}

        {/* Floating Map Navigation Controls */}
        <div className="absolute top-3 right-14 flex flex-col gap-1.5 z-10">
          {hasSupervisor && (
            <button
              type="button"
              onClick={handleRecenterSupervisor}
              className="px-2.5 py-1.5 rounded-xl bg-[#10231D]/90 hover:bg-[#10231D] backdrop-blur-md text-[#E9A23B] border border-[#2D453B] text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              title="Focus on Supervisor"
            >
              <LuNavigation className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span className="hidden sm:inline">Supervisor</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRecenterDestination}
            className="px-2.5 py-1.5 rounded-xl bg-[#10231D]/90 hover:bg-[#10231D] backdrop-blur-md text-[#F4EFE6] border border-[#2D453B] text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            title="Focus on Destination Doorstep"
          >
            <LuMapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Doorstep</span>
          </button>
          {hasSupervisor && (
            <button
              type="button"
              onClick={handleFitRoute}
              className="px-2.5 py-1.5 rounded-xl bg-[#10231D]/90 hover:bg-[#10231D] backdrop-blur-md text-[#A3B8B0] hover:text-[#F4EFE6] border border-[#2D453B] text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              title="Fit Full Route"
            >
              <LuCompass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fit Route</span>
            </button>
          )}
        </div>

        {/* Smart Banner on Map when Supervisor is NOT Yet Assigned */}
        {!hasSupervisor && (
          <div className="absolute top-3 left-3 right-16 sm:max-w-md z-10 pointer-events-none">
            <div className="backdrop-blur-md bg-[#10231D]/95 border border-[#E9A23B]/60 text-[#F4EFE6] px-4 py-3 rounded-2xl shadow-xl flex items-start gap-3 pointer-events-auto">
              <div className="w-8 h-8 rounded-xl bg-[#E9A23B]/20 border border-[#E9A23B]/40 flex items-center justify-center shrink-0 mt-0.5">
                <LuClock className="w-4 h-4 text-[#E9A23B]" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#E9A23B] uppercase tracking-wide">
                  Supervisor Not Yet Assigned
                </p>
                <p className="text-[11px] text-[#D7E2DD] mt-0.5 leading-relaxed">
                  Our dispatch team is allocating a field supervisor for your booking. Live route & ETA will start automatically once assigned.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Uber/Rapido Live Arrival Pill on Map */}
        {hasSupervisor && etaInfo && (
          <div className="absolute top-3 left-3 right-16 sm:right-auto z-10 pointer-events-none">
            <div className={`backdrop-blur-md px-4 py-2.5 rounded-2xl border shadow-xl flex items-center gap-3 pointer-events-auto ${
              etaInfo.isArrived
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                : 'bg-[#10231D]/95 border-[#E9A23B]/60 text-[#F4EFE6]'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${etaInfo.isArrived ? 'bg-emerald-400' : 'bg-[#E9A23B]'} relative flex items-center justify-center shrink-0`}>
                <span className={`w-2.5 h-2.5 rounded-full ${etaInfo.isArrived ? 'bg-emerald-400' : 'bg-[#E9A23B]'} absolute inset-0 animate-ping opacity-75`} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase tracking-wide">
                    {etaInfo.distanceText}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/50 text-[#E9A23B] font-bold">
                    {etaInfo.etaText}
                  </span>
                </div>
                <p className="text-[10px] text-[#A3B8B0] line-clamp-1">
                  {etaInfo.statusText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live overlay update time */}
        <div className="absolute bottom-3 right-14 pointer-events-none">
          <div className="bg-[#10231D]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2D453B] flex items-center gap-1.5 text-[10px] text-[#A3B8B0] shadow-sm">
            <LuCompass className="w-3 h-3 text-[#E9A23B]" />
            <span>Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Footer Info: Smart Check for Supervisor Assignment vs Pending */}
      <div className="p-3.5 bg-[#0C1B16] border-t border-[#2D453B]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {hasSupervisor ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2D453B] border border-[#E9A23B]/40 flex items-center justify-center text-[#E9A23B] font-bold">
              {currentSupervisor?.name ? currentSupervisor.name.charAt(0).toUpperCase() : <LuUser className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[#F4EFE6]">{currentSupervisor?.name || 'Assigned Supervisor'}</p>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E9A23B]/20 text-[#E9A23B] font-bold">
                  Lead
                </span>
              </div>
              {currentSupervisor?.phone && (
                <div className="flex items-center gap-3 mt-0.5">
                  <a
                    href={`tel:${currentSupervisor.phone}`}
                    className="text-[11px] text-[#A3B8B0] hover:text-[#E9A23B] flex items-center gap-1 transition-colors"
                  >
                    <LuPhone className="w-3 h-3 text-[#25D366]" />
                    <span>Call: +91 {currentSupervisor.phone}</span>
                  </a>
                  <a
                    href={`https://wa.me/91${currentSupervisor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${currentSupervisor.name || ''}, tracking booking #${bookingCode}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#25D366] hover:underline flex items-center gap-1 transition-colors"
                  >
                    <FaWhatsapp className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2D453B]/60 border border-[#E9A23B]/30 flex items-center justify-center text-[#E9A23B]">
              <LuClock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[#F4EFE6]">Supervisor Not Yet Assigned</p>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-[#E9A23B] border border-[#E9A23B]/30 font-bold">
                  Pending
                </span>
              </div>
              <p className="text-[11px] text-[#A3B8B0] mt-0.5">
                Supervisor contact & live GPS route will unlock once assigned
              </p>
            </div>
          </div>
        )}

        {destinationAddress && (
          <div className="text-left sm:text-right max-w-sm truncate text-[11px] text-[#A3B8B0]">
            <span className="text-[#6B8077] block font-mono text-[10px] uppercase font-bold">Address</span>
            <span className="truncate block font-medium text-[#F4EFE6]">{destinationAddress}</span>
          </div>
        )}
      </div>
    </div>
  );
}
