import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';
import { useToast } from './ToastContext';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  // Booking items in cart: [{ service, selections: { size: '2-bhk' }, qty: 1 }]
  const [items, setItems] = useState([]);
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
        if (res && res.success !== false && Array.isArray(res.cities)) {
          setCities(res.cities);
          if (!selectedCity && res.cities.length > 0) {
            setSelectedCity(res.cities[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load cities in BookingContext:', err);
      }
    }
    loadCities();
  }, []);

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
      // Offline fallback: calculate basic price
      const subtotal = currentItems.reduce((acc, i) => acc + (i.service.price || 0) * (i.qty || 1), 0);
      const mrpTotal = currentItems.reduce((acc, i) => acc + (i.service.mrp || i.service.price || 0) * (i.qty || 1), 0);
      setQuote({
        items: currentItems.map(i => ({
          serviceId: i.service._id,
          title: i.service.title,
          unitPrice: i.service.price,
          unitMrp: i.service.mrp || i.service.price,
          totalPrice: (i.service.price || 0) * (i.qty || 1),
          totalMrp: (i.service.mrp || i.service.price || 0) * (i.qty || 1),
          qty: i.qty || 1,
          savings: Math.max(0, (i.service.mrp || i.service.price) - i.service.price) * (i.qty || 1),
          discountPct: i.service.mrp ? Math.round(((i.service.mrp - i.service.price) / i.service.mrp) * 100) : 0
        })),
        totals: {
          subtotal,
          mrpTotal,
          discount: mrpTotal - subtotal,
          couponDiscount: 0,
          total: subtotal,
          customerSaved: mrpTotal - subtotal,
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
    setItems((prev) => {
      // Check if service already exists with identical selections
      const existingIdx = prev.findIndex(item => {
        if (item.service._id !== service._id) return false;
        const s1 = JSON.stringify(item.selections || {});
        const s2 = JSON.stringify(selections || {});
        return s1 === s2;
      });

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].qty += qty;
        toast.info(`Updated quantity for ${service.title}`);
        return updated;
      } else {
        toast.success(`Added ${service.title} to booking list`);
        return [...prev, { service, selections, qty }];
      }
    });
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
        updated[index].qty = newQty;
      }
      return updated;
    });
  };

  // Remove item
  const removeItem = (index) => {
    setItems((prev) => {
      const item = prev[index];
      if (item) toast.info(`Removed ${item.service.title}`);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // Clear all items
  const clearItems = () => {
    setItems([]);
    setQuote(null);
    setAppliedCoupon(null);
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
        refreshQuote
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

export default BookingContext;
