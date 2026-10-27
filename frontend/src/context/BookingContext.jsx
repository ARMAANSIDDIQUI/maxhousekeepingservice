import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../api';
import { useToast } from './ToastContext';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  // Booking items in cart: [{ service, selections: { size: '2-bhk' }, qty: 1 }]
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('max_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('max_cart_items', JSON.stringify(items));
    } catch {}
  }, [items]);
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem('max_selected_city');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cities, setCities] = useState([]);
  const [isDetectingCity, setIsDetectingCity] = useState(false);
  const { toast } = useToast();

  // Known coordinates of active service cities in Western UP
  const CITY_COORDINATES = useMemo(() => ({
    moradabad: { lat: 28.8386, lng: 78.7733 },
    rampur: { lat: 28.8033, lng: 79.0250 },
    amroha: { lat: 28.9044, lng: 78.4678 },
    gajraula: { lat: 28.8500, lng: 78.2333 },
    sambhal: { lat: 28.5833, lng: 78.5667 },
    chandausi: { lat: 28.4500, lng: 78.7833 },
    noorpur: { lat: 29.1500, lng: 78.4000 },
    dhampur: { lat: 29.3100, lng: 78.5100 },
    bijnor: { lat: 29.3732, lng: 78.1352 }
  }), []);

  // Detect city via browser geolocation
  const detectAndSelectCity = useCallback(async ({ silent = false, showToast = true } = {}) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error('Geolocation is not supported by your browser.');
      return null;
    }

    setIsDetectingCity(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setIsDetectingCity(false);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let matchedCity = null;

          // 1. Check with Google Maps Geocoder if loaded
          try {
            if (window.google?.maps?.Geocoder) {
              const geocoder = new window.google.maps.Geocoder();
              const response = await geocoder.geocode({ location: { lat, lng } });
              if (response?.results?.[0]?.address_components) {
                const comps = response.results[0].address_components;
                const locality = comps.find(c =>
                  c.types.includes('locality') ||
                  c.types.includes('administrative_area_level_2')
                );
                if (locality?.long_name) {
                  const targetName = locality.long_name.toLowerCase();
                  matchedCity = cities.find(c =>
                    c.name.toLowerCase() === targetName ||
                    targetName.includes(c.name.toLowerCase()) ||
                    c.slug === targetName
                  );
                }
              }
            }
          } catch (e) {
            console.warn('[City Geocoder lookup notice]:', e.message);
          }

          // 2. Haversine distance proximity fallback against active service cities
          if (!matchedCity && cities.length > 0) {
            let closest = null;
            let minDistance = Infinity;

            for (const c of cities) {
              const coords = CITY_COORDINATES[c.slug] || CITY_COORDINATES[c.name.toLowerCase()];
              if (coords) {
                const dLat = (lat - coords.lat) * (Math.PI / 180);
                const dLng = (lng - coords.lng) * (Math.PI / 180);
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * (Math.PI / 180)) * Math.cos(coords.lat * (Math.PI / 180)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                if (d < minDistance) {
                  minDistance = d;
                  closest = c;
                }
              }
            }

            if (closest && minDistance <= 85) {
              matchedCity = closest;
            } else if (closest) {
              matchedCity = cities.find(c => c.slug === 'moradabad') || closest;
            }
          }

          if (!matchedCity && cities.length > 0) {
            matchedCity = cities.find(c => c.slug === 'moradabad') || cities[0];
          }

          if (matchedCity) {
            setSelectedCity(matchedCity);
            try {
              localStorage.setItem('max_selected_city', JSON.stringify(matchedCity));
              localStorage.setItem('max_location_choice_made', 'true');
            } catch {}

            if (showToast) {
              toast.success(`Location detected: Selected ${matchedCity.name} as your service city.`);
            }
            resolve(matchedCity);
          } else {
            resolve(null);
          }
        },
        (err) => {
          setIsDetectingCity(false);
          console.warn('[Geolocation error]:', err.message);
          if (!silent) {
            if (err.code === 1) {
              toast.error('Location permission was denied. You can select your city manually from the list.');
            } else {
              toast.error('Unable to retrieve current location. Please choose your city manually.');
            }
          }
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });
  }, [cities, CITY_COORDINATES, toast]);

  // Load cities dynamically from MongoDB
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await apiRequest('/locations/cities');
        if (res && res.success !== false && Array.isArray(res.cities) && res.cities.length > 0) {
          setCities(res.cities);
          // Validate selectedCity against active cities list
          if (selectedCity) {
            const matched = res.cities.find(c => c.slug === selectedCity.slug || c.name === selectedCity.name);
            if (!matched) {
              const mbd = res.cities.find(c => c.slug === 'moradabad') || res.cities[0];
              setSelectedCity(mbd);
            }
          } else {
            const mbd = res.cities.find(c => c.slug === 'moradabad') || res.cities[0];
            setSelectedCity(mbd);
          }

          // If location permission was already granted in browser, auto-detect city silently
          if (!localStorage.getItem('max_location_choice_made') && navigator.permissions?.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((status) => {
              if (status.state === 'granted') {
                detectAndSelectCity({ silent: true, showToast: false });
              }
            }).catch(() => {});
          }
        } else {
          setCities([]);
          setSelectedCity(null);
          try { localStorage.removeItem('max_selected_city'); } catch {}
        }
      } catch (err) {
        console.warn('Failed to load cities in BookingContext:', err);
        setCities([]);
        setSelectedCity(null);
        try { localStorage.removeItem('max_selected_city'); } catch {}
      }
    }
    loadCities();
  }, []);

  // Dynamic Business & Operational Settings from MongoDB
  const [settings, setSettings] = useState({
    brandName: 'Max Housekeeping Service',
    businessName: 'Max Housekeeping Service',
    tagline: 'A spotless home, without lifting a finger.',
    phone: '+91 98977 66002',
    primaryPhone: '+91 98977 66002',
    alternatePhone: '',
    secondaryPhone: '',
    whatsappNumber: '+91 98977 66002',
    email: 'contactmaxhousekeepingservice@gmail.com',
    supportEmail: 'contactmaxhousekeepingservice@gmail.com',
    instagramUrl: 'https://www.instagram.com/maxhousekeepingservice/',
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    address: 'Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
    ratingClaim: 'Rated 4.9/5 by 10,000+ happy homes',
    acceptOnlinePayments: false
  });

  const refreshSettings = useCallback(async () => {
    try {
      const res = await apiRequest('/public/settings', { noCache: true });
      if (res && res.success !== false && res.settings) {
        setSettings(prev => ({
          ...prev,
          ...res.settings,
          brandName: res.settings.brandName || res.settings.businessName || prev.brandName,
          phone: res.settings.phone || res.settings.primaryPhone || prev.phone,
          primaryPhone: res.settings.primaryPhone || res.settings.phone || prev.primaryPhone,
          alternatePhone: res.settings.alternatePhone !== undefined ? res.settings.alternatePhone : (res.settings.secondaryPhone !== undefined ? res.settings.secondaryPhone : ''),
          secondaryPhone: res.settings.secondaryPhone !== undefined ? res.settings.secondaryPhone : (res.settings.alternatePhone !== undefined ? res.settings.alternatePhone : ''),
          whatsappNumber: res.settings.whatsappNumber || prev.whatsappNumber,
          email: res.settings.email || res.settings.supportEmail || prev.email,
          supportEmail: res.settings.supportEmail || res.settings.email || prev.supportEmail,
          instagramUrl: res.settings.instagramUrl || prev.instagramUrl || 'https://www.instagram.com/maxhousekeepingservice/',
          workingHours: res.settings.workingHours || prev.workingHours,
          address: res.settings.address || prev.address,
          ratingClaim: res.settings.ratingClaim || prev.ratingClaim,
          acceptOnlinePayments: Boolean(res.settings.acceptOnlinePayments)
        }));
      }
    } catch (err) {
      console.warn('Failed to load dynamic business settings in BookingContext:', err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();

    const handleSync = () => {
      refreshSettings();
    };

    window.addEventListener('max_settings_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('max_settings_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [refreshSettings]);

  useEffect(() => {
    if (selectedCity) {
      try {
        localStorage.setItem('max_selected_city', JSON.stringify(selectedCity));
      } catch (err) {
        console.warn('Failed to cache selected city:', err);
      }
    }
  }, [selectedCity]);

  const [quote, setQuote] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Address State (saved address dropdown vs. temporary address checkbox)
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'new' | 'temporary'
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    line1: '',
    landmark: '',
    cityText: 'Moradabad',
    stateText: 'Uttar Pradesh',
    pincode: '',
    isTemporary: false
  });

  // Slot State
  const [slot, setSlot] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    window: 'Morning (8:00 AM – 11:00 AM)'
  });

  // Customer Contact Details
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Fetch Live Dual-Price Quote from Server
  const refreshQuote = useCallback(async (currentItems, citySlug, coupon) => {
    if (!currentItems || currentItems.length === 0) {
      setQuote(null);
      return null;
    }

    setIsQuoting(true);
    try {
      const activeCoupon = coupon !== undefined ? coupon : couponCode;
      const payload = {
        items: currentItems.map(i => ({
          serviceId: i.service._id || i.service.id,
          selections: i.selections || {},
          qty: i.qty || 1
        })),
        citySlug: citySlug || selectedCity?.slug || 'moradabad',
        couponCode: activeCoupon ? activeCoupon.trim().toUpperCase() : undefined,
        customer: {
          phone: customer?.phone,
          email: customer?.email
        },
        phone: customer?.phone,
        email: customer?.email
      };

      const res = await apiRequest('/bookings/quote', {
        method: 'POST',
        body: payload
      });

      if (res.success && res.quote) {
        setQuote(res.quote);
        if (res.quote.coupon) {
          setAppliedCoupon(res.quote.coupon);
        } else {
          setAppliedCoupon(null);
        }
        return res.quote;
      }
      return null;
    } catch {
      // Offline fallback: calculate accurate variant price locally
      const isMbd = !selectedCity || (selectedCity.slug || '').toLowerCase() === 'moradabad';
      const citySlug = (selectedCity?.slug || 'moradabad').toLowerCase().trim();

      const enriched = currentItems.map(i => {
        let p = i.service.price || 0;
        let m = i.service.mrp || i.service.price || 0;

        // Check custom city-specific rates
        let cityRateMatched = false;
        let cityMatchedRate = null;
        let cityMatchedMrp = null;

        if (i.service.hasCitySpecificRates && Array.isArray(i.service.cityRates) && i.service.cityRates.length > 0) {
          const match = i.service.cityRates.find(cr => (cr.citySlug || '').toLowerCase().trim() === citySlug);
          if (match && typeof match.rate === 'number' && match.rate > 0) {
            cityRateMatched = true;
            cityMatchedRate = match.rate;
            if (typeof match.mrp === 'number' && match.mrp > 0) {
              cityMatchedMrp = match.mrp;
            }
          }
        }

        // Dynamic Unit Pricing
        if (i.service.pricingType === 'unit' || (i.service.pricingUnit && i.service.pricingUnit !== 'fixed')) {
          let activeRate = isMbd
            ? (typeof i.service.unitRateMoradabad === 'number' ? i.service.unitRateMoradabad : (i.service.price || 0))
            : (typeof i.service.unitRateOther === 'number'
              ? i.service.unitRateOther
              : (typeof i.service.unitRateMoradabad === 'number' ? i.service.unitRateMoradabad : i.service.price || 0));

          if (cityRateMatched && cityMatchedRate !== null) {
            activeRate = cityMatchedRate;
          }

          const unitCount = Number(
            i.selections?.units ??
            i.selections?.unitCount ??
            i.selections?.sqFt ??
            i.selections?.litres ??
            i.selections?.seats ??
            i.selections?.chairs ??
            i.selections?.fans
          ) || i.service.minUnitQuantity || 1;

          p = Math.round(activeRate * unitCount);
          const mrpFactor = (i.service.mrp && i.service.price && i.service.mrp > i.service.price) ? (i.service.mrp / i.service.price) : 1.25;
          m = cityMatchedMrp ? Math.round(cityMatchedMrp * unitCount) : Math.round(p * mrpFactor);
        } else {
          // Normal service
          if (cityRateMatched && cityMatchedRate !== null) {
            p = cityMatchedRate;
            m = cityMatchedMrp !== null ? cityMatchedMrp : (i.service.mrp && i.service.price ? Math.round(cityMatchedRate * (i.service.mrp / i.service.price)) : Math.round(cityMatchedRate * 1.25));
          }
        }

        // Matrix match
        if (i.service.matrix && Array.isArray(i.service.matrix) && i.service.matrix.length > 0) {
          const match = i.service.matrix.find(row => {
            if (row.isActive === false) return false;
            const sel = row.selection instanceof Map ? Object.fromEntries(row.selection) : (row.selection || {});
            const keys = Object.keys(sel);
            return keys.length > 0 && keys.every(k => String(sel[k]).toLowerCase().trim() === String((i.selections || {})[k] || '').toLowerCase().trim());
          });
          if (match) {
            if (cityRateMatched && cityMatchedRate !== null && i.service.price && i.service.price > 0) {
              const ratio = cityMatchedRate / i.service.price;
              p = Math.round(match.price * ratio);
              const mrpRatio = cityMatchedMrp ? (cityMatchedMrp / (i.service.mrp || i.service.price)) : ratio;
              m = Math.round((match.mrp || match.price) * mrpRatio);
            } else {
              p = match.price;
              m = match.mrp || match.price;
            }
          }
        }

        // Outstation extra surcharge
        let outstationExtra = 0;
        if (!isMbd) {
          outstationExtra = (typeof i.service.cityExtraCharge === 'number' && i.service.cityExtraCharge >= 0)
            ? i.service.cityExtraCharge
            : 100;
          p += outstationExtra;
          m += outstationExtra;
        }

        const qty = i.qty || 1;
        return {
          serviceId: i.service._id,
          title: i.service.title,
          unitPrice: p,
          unitMrp: m,
          outstationSurcharge: outstationExtra,
          totalPrice: p * qty,
          totalMrp: m * qty,
          qty,
          savings: Math.max(0, m - p) * qty,
          discountPct: m > 0 ? Math.round(((m - p) / m) * 100) : 0
        };
      });

      const subtotal = enriched.reduce((acc, it) => acc + it.totalPrice, 0);
      const mrpTotal = enriched.reduce((acc, it) => acc + it.totalMrp, 0);
      const totalOutstationSurcharge = !isMbd
        ? enriched.reduce((acc, it) => acc + ((it.outstationSurcharge || 0) * (it.qty || 1)), 0)
        : 0;

      setQuote({
        items: enriched,
        totals: {
          subtotal,
          mrpTotal,
          outstationSurcharge: totalOutstationSurcharge,
          discount: Math.max(0, mrpTotal - subtotal),
          couponDiscount: 0,
          total: subtotal,
          customerSaved: Math.max(0, mrpTotal - subtotal),
          overallDiscountPct: mrpTotal > 0 ? Math.round(((mrpTotal - subtotal) / mrpTotal) * 100) : 0
        }
      });
    } finally {
      setIsQuoting(false);
    }
  }, [selectedCity, couponCode]);

  // Recalculate quote whenever items change
  useEffect(() => {
    refreshQuote(items, selectedCity?.slug, couponCode);
  }, [items, selectedCity, couponCode, refreshQuote]);

  // Add a service item to booking cart
  const addItem = (service, selections = {}, qty = 1) => {
    if (!service) return;

    // Check if service already exists with identical selections in current state
    const existingIdx = items.findIndex(item => {
      if (item.service?._id !== service._id) return false;
      const s1 = JSON.stringify(item.selections || {});
      const s2 = JSON.stringify(selections || {});
      return s1 === s2;
    });

    const wasExisting = existingIdx > -1;

    setItems((prev) => {
      const idx = prev.findIndex(item => {
        if (item.service?._id !== service._id) return false;
        const s1 = JSON.stringify(item.selections || {});
        const s2 = JSON.stringify(selections || {});
        return s1 === s2;
      });

      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: (updated[idx].qty || 1) + qty };
        return updated;
      } else {
        return [...prev, { service, selections, qty }];
      }
    });

    if (wasExisting) {
      toast.info(`Updated quantity for ${service.title}`);
    } else {
      toast.success(`Added ${service.title} to booking list`);
    }
  };

  // Update item variant (e.g. BHK size, seats count)
  const updateItemVariant = (index, newSelections) => {
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], selections: newSelections };
      }
      return updated;
    });
  };

  // Update item quantity
  const updateItemQty = (index, newQty) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], qty: newQty };
      }
      return updated;
    });
  };

  // Remove item
  const removeItem = (index) => {
    const item = items[index];
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    if (item?.service?.title) {
      toast.info(`Removed ${item.service.title}`);
    }
  };

  // Clear all items
  const clearItems = () => {
    setItems([]);
    setQuote(null);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('max_cart_items');
    } catch {}
  };

  // Apply Coupon
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    setCouponCode(cleanCode);
    const resQuote = await refreshQuote(items, selectedCity?.slug, cleanCode);
    if (resQuote?.couponError) {
      toast.error(resQuote.couponError);
    } else if (resQuote?.totals?.couponDiscount > 0) {
      toast.success(`Coupon ${cleanCode} applied! You saved ₹${resQuote.totals.couponDiscount}`);
    } else {
      toast.success(`Coupon ${cleanCode} applied!`);
    }
  };

  // Remove Coupon
  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    refreshQuote(items, selectedCity?.slug, '');
    toast.info('Coupon removed.');
  };

  return (
    <BookingContext.Provider
      value={{
        items,
        quote,
        isQuoting,
        selectedCity,
        setSelectedCity,
        cities,
        setCities,
        couponCode,
        appliedCoupon,
        addressMode,
        setAddressMode,
        selectedSavedAddressId,
        setSelectedSavedAddressId,
        addressDetails,
        setAddressDetails,
        slot,
        setSlot,
        customer,
        setCustomer,
        addItem,
        updateItemVariant,
        updateItemQty,
        removeItem,
        clearItems,
        applyCoupon,
        removeCoupon,
        refreshQuote,
        detectAndSelectCity,
        isDetectingCity,
        settings,
        refreshSettings
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

export function useSettings() {
  const context = useBooking();
  return context.settings;
}

export default BookingContext;
