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
  LuCircleCheck
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { loadGoogleMapsScript } from '../../utils/googleMapsLoader';
import { calculateDistanceKm, getEtaInfo } from '../../utils/geoUtils';

/**
 * LiveTrackingRadar
 * Interactive Real-Time Map showing Supervisor Live Vehicle Location & Customer Doorstep Pin.
 * Displays live Uber/Rapido-style distance and ETA calculated client-side with Zero ($0.00) Google API fees.
 */
export default function LiveTrackingRadar({
  bookingCode,
  initialSupervisorLocation = null,
  customerLocation = null,
  destinationAddress = '',
  supervisorInfo = null,
  pollIntervalMs = 12000
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [liveLocation, setLiveLocation] = useState(initialSupervisorLocation);
  const [isSharing, setIsSharing] = useState(Boolean(initialSupervisorLocation?.isSharing ?? true));
  const [lastUpdated, setLastUpdated] = useState(initialSupervisorLocation?.updatedAt ? new Date(initialSupervisorLocation.updatedAt) : new Date());
  const [resolvedCustomerLoc, setResolvedCustomerLoc] = useState(customerLocation);
  const [resolvedSupervisor, setResolvedSupervisor] = useState(supervisorInfo);
  const [distanceKm, setDistanceKm] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const supervisorMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routePolylineRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Helper to draw or update route line between supervisor location and customer doorstep
  const updateRouteLine = (start, end) => {
    if (!start || !end || !window.google?.maps || !mapInstanceRef.current) return;
    const google = window.google;

    const startPos = { lat: Number(start.lat), lng: Number(start.lng) };
    const endPos = { lat: Number(end.lat), lng: Number(end.lng) };

    if (google.maps.DirectionsService && google.maps.DirectionsRenderer) {
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

      const ds = new google.maps.DirectionsService();
      ds.route(
        {
          origin: startPos,
          destination: endPos,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current?.setDirections(result);
            if (routePolylineRef.current) {
              routePolylineRef.current.setMap(null);
            }
          } else {
            drawFallbackPolyline(startPos, endPos);
          }
        }
      );
    } else {
      drawFallbackPolyline(startPos, endPos);
    }
  };

  const drawFallbackPolyline = (start, end) => {
    if (!window.google?.maps || !mapInstanceRef.current) return;
    const google = window.google;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    routePolylineRef.current = new google.maps.Polyline({
      path: [start, end],
      geodesic: true,
      strokeColor: '#E9A23B',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map: mapInstanceRef.current
    });
  };

  // Sync prop changes
  useEffect(() => {
    if (customerLocation && (!resolvedCustomerLoc || customerLocation.lat !== resolvedCustomerLoc.lat)) {
      setResolvedCustomerLoc(customerLocation);
    }
  }, [customerLocation]);

  useEffect(() => {
    if (supervisorInfo && !resolvedSupervisor) {
      setResolvedSupervisor(supervisorInfo);
    }
  }, [supervisorInfo]);

  // Poll live location endpoint
  const fetchLiveLocation = async () => {
    if (!bookingCode || document.hidden) return;

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/bookings/${encodeURIComponent(bookingCode)}/live-location`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsSharing(Boolean(data.isSharing));
          if (data.customerLocation && !resolvedCustomerLoc) {
            setResolvedCustomerLoc(data.customerLocation);
          }
          if (data.supervisor) {
            setResolvedSupervisor((prev) => ({ ...prev, ...data.supervisor }));
          }
          if (data.supervisorLocation) {
            setLiveLocation(data.supervisorLocation);
            setLastUpdated(new Date(data.supervisorLocation.updatedAt || Date.now()));

            // Update in-memory map marker position without re-rendering map
            if (supervisorMarkerRef.current) {
              const newPos = {
                lat: data.supervisorLocation.lat,
                lng: data.supervisorLocation.lng
              };
              supervisorMarkerRef.current.setPosition(newPos);
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
    if (cust?.lat && liveLocation?.lat) {
      const dist = calculateDistanceKm(
        cust.lat,
        cust.lng,
        liveLocation.lat,
        liveLocation.lng
      );
      setDistanceKm(dist);
    }
  }, [resolvedCustomerLoc, customerLocation, liveLocation]);

  const etaInfo = getEtaInfo(distanceKm);

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

      const supPos =
        liveLocation && typeof liveLocation.lat === 'number'
          ? liveLocation
          : custPos;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: supPos,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      });

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

      // Draw Route Line between Supervisor and Customer Doorstep
      if (cust && liveLocation) {
        updateRouteLine(supPos, custPos);
      }

      // Adjust bounds to fit both markers
      if (cust && liveLocation) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(custPos);
        bounds.extend(supPos);
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    } catch (err) {
      console.warn('[LiveTrackingRadar] Map canvas error:', err);
    }
  }, [mapLoaded, resolvedCustomerLoc, customerLocation, liveLocation]);

  const targetCoords = resolvedCustomerLoc || customerLocation;
  const navUrl = (targetCoords?.lat && targetCoords?.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetCoords.lat},${targetCoords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress || 'Moradabad')}`;

  const currentSupervisor = resolvedSupervisor || supervisorInfo;

  return (
    <div className="bg-[#10231D] text-[#F4EFE6] rounded-2xl border border-[#2D453B] overflow-hidden shadow-xl">
      {/* Header with Uber/Rapido-Style Distance & ETA */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D453B]/70 bg-[#0C1B16]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className={`w-3 h-3 rounded-full ${isSharing ? 'bg-[#25D366]' : 'bg-[#6B8077]'} block`} />
            {isSharing && (
              <span className="w-3 h-3 rounded-full bg-[#25D366] absolute inset-0 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E9A23B]">
                {isSharing ? 'LIVE LOCATION MAP' : 'SUPERVISOR ASSIGNED'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isSharing ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-[#2D453B] text-[#A3B8B0]'
              }`}>
                {isSharing ? 'Sharing On' : 'Sharing Off'}
              </span>
            </div>
            <p className="text-xs text-[#A3B8B0] mt-0.5">
              {isSharing
                ? etaInfo
                  ? `${etaInfo.statusText} · Ref: #${bookingCode}`
                  : `Supervisor en route to your address · Ref: #${bookingCode}`
                : `Supervisor assigned to your visit · Ref: #${bookingCode}`}
            </p>
          </div>
        </div>

        {/* Uber/Rapido Distance & ETA Pill */}
        <div className="flex items-center gap-2">
          {distanceKm !== null && isSharing && etaInfo && (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#2D453B] border border-[#3E5C4F] flex items-center gap-3">
              <div>
                <span className="text-[9px] text-[#A3B8B0] block uppercase font-mono font-bold">Distance</span>
                <span className="text-xs font-black text-[#E9A23B] tnum">{etaInfo.distanceText}</span>
              </div>
              <div className="border-l border-[#3E5C4F] pl-2.5">
                <span className="text-[9px] text-[#A3B8B0] block uppercase font-mono font-bold">ETA</span>
                <span className="text-xs font-black text-emerald-300 tnum">{etaInfo.etaText}</span>
              </div>
            </div>
          )}

          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-[#E9A23B] hover:bg-[#d4902f] text-[#10231D] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Open Maps</span>
            <LuExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Map Canvas with Floating Uber-Style Live Pill */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-60 sm:h-72 bg-[#0C1B16]"
          style={{ minHeight: '230px' }}
        />

        {/* Floating Uber/Rapido Live Arrival Pill on Map */}
        {isSharing && etaInfo && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 pointer-events-none">
            <div className={`backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-xl flex items-center gap-3 pointer-events-auto ${
              etaInfo.isArrived
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                : 'bg-[#10231D]/90 border-[#E9A23B]/60 text-[#F4EFE6]'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${etaInfo.isArrived ? 'bg-emerald-400' : 'bg-[#E9A23B]'} relative flex items-center justify-center`}>
                <span className={`w-2.5 h-2.5 rounded-full ${etaInfo.isArrived ? 'bg-emerald-400' : 'bg-[#E9A23B]'} absolute inset-0 animate-ping opacity-75`} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase tracking-wide">
                    {etaInfo.distanceText}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/50 text-[#E9A23B] font-bold">
                    {etaInfo.etaText}
                  </span>
                </div>
                <p className="text-[10px] text-[#A3B8B0]">
                  {etaInfo.statusText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live overlay update time */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <div className="bg-[#10231D]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#2D453B] flex items-center gap-1.5 text-[10px] text-[#A3B8B0]">
            <LuCompass className="w-3 h-3 text-[#E9A23B]" />
            <span>Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Footer Info: Supervisor Details & Doorstep Address */}
      <div className="p-3.5 bg-[#0C1B16] border-t border-[#2D453B]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#2D453B] border border-[#E9A23B]/40 flex items-center justify-center text-[#E9A23B] font-bold">
            {currentSupervisor?.name ? currentSupervisor.name.charAt(0).toUpperCase() : <LuUser className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-[#F4EFE6]">{currentSupervisor?.name || 'Assigned Lead Supervisor'}</p>
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
