import React, { useState, useEffect, useRef } from 'react';
import {
  LuNavigation,
  LuMapPin,
  LuClock,
  LuShieldCheck,
  LuCompass,
  LuExternalLink,
  LuPhone,
  LuUser
} from 'react-icons/lu';
import { loadGoogleMapsScript } from '../../utils/googleMapsLoader';

/**
 * Calculates straight-line distance in kilometers (Haversine formula)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * LiveTrackingRadar
 * Interactive Real-Time Map Radar showing Supervisor Live Vehicle Location & Customer Doorstep Pin
 * Built with in-memory marker updates (zero additional Google Maps API costs) and tab visibility sleep
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
  const [distanceKm, setDistanceKm] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const supervisorMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Poll live location endpoint
  const fetchLiveLocation = async () => {
    if (!bookingCode || document.hidden) return;

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/bookings/${encodeURIComponent(bookingCode)}/live-location`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsSharing(data.isSharing);
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

    // Pause polling when tab is hidden to eliminate CPU and network overhead
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

    return () => { isMounted = false; };
  }, []);

  // Initialize Map canvas once SDK & container are ready
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const google = window.google;

      const custPos = customerLocation && typeof customerLocation.lat === 'number'
        ? customerLocation
        : { lat: 28.8389, lng: 78.7768 };

      const supPos = liveLocation && typeof liveLocation.lat === 'number'
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

      // Customer Doorstep Marker (Green Pin)
      const custMarker = new google.maps.Marker({
        position: custPos,
        map: map,
        title: 'Customer Doorstep',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10231D',
          fillOpacity: 1,
          strokeColor: '#E9A23B',
          strokeWeight: 3
        }
      });

      // Supervisor Vehicle / Moving Crew Marker (Gold Beacon Pin)
      const supMarker = new google.maps.Marker({
        position: supPos,
        map: map,
        title: `${supervisorInfo?.name || 'Supervisor'} (Live Position)`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#E9A23B',
          fillOpacity: 1,
          strokeColor: '#10231D',
          strokeWeight: 2,
          rotation: liveLocation?.heading || 0
        }
      });

      // Adjust bounds to fit both markers
      if (customerLocation && liveLocation && isSharing) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(custPos);
        bounds.extend(supPos);
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      }

      mapInstanceRef.current = map;
      customerMarkerRef.current = custMarker;
      supervisorMarkerRef.current = supMarker;
    } catch (err) {
      console.warn('[LiveTrackingRadar] Map canvas error:', err);
    }
  }, [mapLoaded, customerLocation, liveLocation]);

  // Update distance calculation
  useEffect(() => {
    if (customerLocation?.lat && liveLocation?.lat) {
      const dist = calculateDistanceKm(
        customerLocation.lat,
        customerLocation.lng,
        liveLocation.lat,
        liveLocation.lng
      );
      setDistanceKm(dist);
    }
  }, [customerLocation, liveLocation]);

  const navUrl = (customerLocation?.lat && customerLocation?.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.lat},${customerLocation.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress || 'Moradabad')}`;

  return (
    <div className="bg-[#10231D] text-[#F4EFE6] rounded-2xl border border-[#2D453B] overflow-hidden shadow-xl">
      {/* Radar Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D453B]/70 bg-[#0C1B16]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-[#25D366] block" />
            <span className="w-3 h-3 rounded-full bg-[#25D366] absolute inset-0 animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E9A23B]">
                {isSharing ? 'LIVE LOCATION MAP' : 'SUPERVISOR ASSIGNED'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D453B] text-[#A3B8B0]">
                {isSharing ? 'Location Sharing On' : 'Location Sharing Off'}
              </span>
            </div>
            <p className="text-xs text-[#A3B8B0] mt-0.5">
              {isSharing
                ? `Supervisor en route to your address · Ref: #${bookingCode}`
                : `Supervisor assigned to your visit · Ref: #${bookingCode}`}
            </p>
          </div>
        </div>

        {/* Navigation & Action */}
        <div className="flex items-center gap-2">
          {distanceKm !== null && isSharing && (
            <div className="px-3 py-1 rounded-xl bg-[#2D453B] border border-[#3E5C4F] text-right">
              <span className="text-[10px] text-[#A3B8B0] block uppercase font-mono">Distance</span>
              <span className="text-xs font-bold text-[#E9A23B] tnum">{distanceKm} km away</span>
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

      {/* Map Radar Canvas */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-56 sm:h-72 bg-[#0C1B16]"
          style={{ minHeight: '220px' }}
        />

        {/* Live overlay badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <div className="bg-[#10231D]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#2D453B] flex items-center gap-2 text-[11px]">
            <LuCompass className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Footer Info: Supervisor & Destination */}
      <div className="p-3.5 bg-[#0C1B16] border-t border-[#2D453B]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2D453B] flex items-center justify-center text-[#E9A23B] font-bold">
            {supervisorInfo?.name ? supervisorInfo.name.charAt(0).toUpperCase() : <LuUser className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-bold text-[#F4EFE6]">{supervisorInfo?.name || 'Assigned Lead Supervisor'}</p>
            {supervisorInfo?.phone && (
              <a
                href={`tel:${supervisorInfo.phone}`}
                className="text-[11px] text-[#A3B8B0] hover:text-[#E9A23B] flex items-center gap-1 transition-colors"
              >
                <LuPhone className="w-3 h-3 text-[#25D366]" />
                <span>+91 {supervisorInfo.phone}</span>
              </a>
            )}
          </div>
        </div>

        {destinationAddress && (
          <div className="text-left sm:text-right max-w-sm truncate text-[11px] text-[#A3B8B0]">
            <span className="text-[#6B8077] block font-mono text-[10px] uppercase">Destination</span>
            <span className="truncate block font-medium text-[#F4EFE6]">{destinationAddress}</span>
          </div>
        )}
      </div>
    </div>
  );
}
