import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    address: 'Kanth road, Behind Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
    ratingClaim: 'Rated 4.9/5 by 10,000+ happy homes',
    acceptOnlinePayments: false
  });

  const refreshSettings = useCallback(async () => {
    try {
      const res = await apiRequest('/public/settings');
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

  const { toast } = useToast();

  // Fetch Live Dual-Price Quote from Server
  const refreshQuote = useCallback(async (currentItems, citySlug, coupon) => {
    if (!currentItems || currentItems.length === 0) {
      setQuote(null);
      return;
    }

    setIsQuoting(true);
    try {
      const payload = {
        items: currentItems.map(i => ({
          serviceId: i.service._id || i.service.id,
          selections: i.selections || {},
          qty: i.qty || 1
        })),
        citySlug: citySlug || selectedCity?.slug || 'moradabad',
        couponCode: coupon || couponCode || undefined
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
      }
    } catch {
      // Offline fallback: calculate accurate variant price locally
      const isMbd = !selectedCity || selectedCity.slug === 'moradabad';
      const enriched = currentItems.map(i => {
        let p = i.service.price || 0;
        let m = i.service.mrp || i.service.price || 0;

        // Dynamic Unit Pricing
        if (i.service.pricingType === 'unit' || (i.service.pricingUnit && i.service.pricingUnit !== 'fixed')) {
          const rateMbd = typeof i.service.unitRateMoradabad === 'number' ? i.service.unitRateMoradabad : (i.service.price || 0);
          const rateOther = typeof i.service.unitRateOther === 'number'
            ? i.service.unitRateOther
            : (typeof i.service.unitRateMoradabad === 'number' ? i.service.unitRateMoradabad : i.service.price || 0);
          const activeRate = isMbd ? rateMbd : rateOther;

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
          m = Math.round(p * mrpFactor);
        } else if (i.service.matrix && Array.isArray(i.service.matrix)) {
          // Matrix match
          const match = i.service.matrix.find(row => {
            if (row.isActive === false) return false;
            const sel = row.selection instanceof Map ? Object.fromEntries(row.selection) : (row.selection || {});
            const keys = Object.keys(sel);
            return keys.length > 0 && keys.every(k => String(sel[k]).toLowerCase().trim() === String((i.selections || {})[k] || '').toLowerCase().trim());
          });
          if (match) {
            p = match.price;
            m = match.mrp || match.price;
          }
        }

        // Outstation surcharge
        if (!isMbd && i.service.cityExtraCharge) {
          p += i.service.cityExtraCharge;
          m += i.service.cityExtraCharge;
        }

        const qty = i.qty || 1;
        return {
          serviceId: i.service._id,
          title: i.service.title,
          unitPrice: p,
          unitMrp: m,
          totalPrice: p * qty,
          totalMrp: m * qty,
          qty,
          savings: Math.max(0, m - p) * qty,
          discountPct: m > 0 ? Math.round(((m - p) / m) * 100) : 0
        };
      });

      const subtotal = enriched.reduce((acc, it) => acc + it.totalPrice, 0);
      const mrpTotal = enriched.reduce((acc, it) => acc + it.totalMrp, 0);
      setQuote({
        items: enriched,
        totals: {
          subtotal,
          mrpTotal,
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
    await refreshQuote(items, selectedCity?.slug, cleanCode);
    toast.success(`Applied coupon code ${cleanCode}!`);
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
