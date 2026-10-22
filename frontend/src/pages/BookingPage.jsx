import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import {
  LuPlus,
  LuTrash2,
  LuCalendar,
  LuClock,
  LuMapPin,
  LuCheck,
  LuTag,
  LuShieldCheck,
  LuChevronDown,
  LuPhone,
  LuUser,
  LuCreditCard,
  LuBanknote,
  LuLock,
  LuLogIn,
  LuCircleAlert,
  LuCalculator,
  LuSparkles,
  LuTruck,
  LuInfo
} from 'react-icons/lu';
import confetti from 'canvas-confetti';
import SEO from '../components/common/SEO';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, FALLBACK_SERVICES } from '../api';
import Modal from '../components/common/Modal';
import CustomSelect from '../components/common/CustomSelect';

// Central Dynamic Helper: Check if a service is available in the target city
export function isServiceAvailableInCity(service, citySlug) {
  if (!service) return false;
  const targetCity = (citySlug || 'moradabad').toLowerCase().trim();

  // Moradabad is the central hub where all services are available
  if (targetCity === 'moradabad') {
    return true;
  }

  // Moradabad-only services are strictly excluded from other cities
  if (service.moradabadOnly === true) {
    return false;
  }

  // 1. Check dynamic cityAvailability or allowedCitySlugs array from MongoDB
  const rawAvailability = service.cityAvailability || service.allowedCitySlugs;
  if (Array.isArray(rawAvailability) && rawAvailability.length > 0) {
    const slugs = rawAvailability.map(c => (typeof c === 'string' ? c : c?.slug || '').toLowerCase().trim());
    if (slugs.includes(targetCity)) {
      return true;
    }
  }

  // 2. Check if service has rates configured for this specific city
  if (service.hasCitySpecificRates && Array.isArray(service.cityRates) && service.cityRates.length > 0) {
    const hasCityRate = service.cityRates.some(cr => (cr.citySlug || '').toLowerCase().trim() === targetCity);
    if (hasCityRate) {
      return true;
    }
  }

  // 3. Fallback for specialized doorstep cleaning services
  const slug = (service.slug || '').toLowerCase();
  const title = (service.title || '').toLowerCase();
  const isSpecialty = (
    slug.includes('sofa') || slug.includes('carpet') || slug.includes('chair') ||
    slug.includes('pool') || slug.includes('swimming') || slug.includes('floor') ||
    title.includes('sofa') || title.includes('carpet') || title.includes('chair') ||
    title.includes('pool') || title.includes('swimming') || title.includes('floor')
  );

  return isSpecialty;
}

// Helper to calculate exact variant unit price and MRP
function getServiceVariantPrice(service, optKey, groupKey, citySlug = 'moradabad', selections = {}) {
  if (!service) return { price: 0, mrp: 0 };
  const isMoradabad = !citySlug || citySlug.toLowerCase() === 'moradabad';

  // 1. Dynamic Per Sq. Ft. / Unit Calculation (ONLY for dedicated unit services without static matrix variants)
  if (service.pricingType === 'unit' && (!service.matrix || service.matrix.length === 0)) {
    let activeRate = isMoradabad
      ? (typeof service.unitRateMoradabad === 'number' ? service.unitRateMoradabad : (service.price || 10))
      : (typeof service.unitRateOther === 'number' ? service.unitRateOther : (service.unitRateMoradabad || service.price || 15));

    // Check specific cityRates override if configured
    if (service.hasCitySpecificRates && Array.isArray(service.cityRates) && service.cityRates.length > 0) {
      const targetSlug = (citySlug || 'moradabad').toLowerCase().trim();
      const match = service.cityRates.find(cr => (cr.citySlug || '').toLowerCase().trim() === targetSlug);
      if (match && typeof match.rate === 'number' && match.rate > 0) {
        activeRate = match.rate;
      }
    }

    const minQty = Number(service.minUnitQuantity) || 100;
    const userEntered = Number(
      selections?.sqFt ??
      selections?.units ??
      selections?.unitCount ??
      selections?.litres ??
      selections?.seats ??
      selections?.chairs ??
      selections?.fans
    ) || minQty;

    // Minimum sq ft rule: customer cannot be charged less than minimum sq ft
    const effectiveUnits = Math.max(minQty, userEntered);

    let p = Math.round(activeRate * effectiveUnits);
    const mrpFactor = (service.mrp && service.price && service.mrp > service.price) ? (service.mrp / service.price) : 1.25;
    let m = Math.round(p * mrpFactor);

    if (!isMoradabad && service.cityExtraCharge) {
      p += service.cityExtraCharge;
      m += service.cityExtraCharge;
    }

    return {
      price: p,
      mrp: m,
      duration: service.duration || '1-2 hrs',
      activeRate,
      unitCount: userEntered,
      effectiveUnits,
      minQty,
      isUnit: true
    };
  }

  // 2. Matrix row match
  let basePrice = service.price || 0;
  let baseMrp = service.mrp || service.price || 0;
  let duration = service.duration || '1.5 hrs';

  if (service.matrix && Array.isArray(service.matrix) && service.matrix.length > 0) {
    for (const row of service.matrix) {
      if (row.isActive === false) continue;
      const sel = row.selection instanceof Map ? Object.fromEntries(row.selection) : (row.selection || {});
      const rowVal = String(sel[groupKey] || '').toLowerCase().trim();
      if (rowVal === String(optKey).toLowerCase().trim()) {
        basePrice = row.price;
        baseMrp = row.mrp || row.price;
        if (row.duration) duration = row.duration;
        break;
      }
    }
  } else {
    const group = service.optionGroups?.find(g => g.key === groupKey);
    const opt = group?.options?.find(o => o.key === optKey);
    if (opt) {
      basePrice += (opt.priceDelta || 0);
      baseMrp += (opt.mrpDelta || opt.priceDelta || 0);
      if (opt.multiplier && opt.multiplier > 0) {
        basePrice = Math.round(basePrice * opt.multiplier);
        baseMrp = Math.round(baseMrp * opt.multiplier);
      }
      if (opt.durationDelta) duration = opt.durationDelta;
    }
  }

  // Check additional option selections (e.g. backside)
  if (service.optionGroups && Array.isArray(service.optionGroups)) {
    for (const grp of service.optionGroups) {
      if (grp.key === groupKey) continue;
      const chosen = selections?.[grp.key];
      if (chosen) {
        const opt = grp.options?.find(o => o.key === chosen);
        if (opt) {
          basePrice += (opt.priceDelta || 0);
          baseMrp += (opt.mrpDelta || opt.priceDelta || 0);
        }
      }
    }
  }

  // Outstation surcharge
  if (!isMoradabad && service.cityExtraCharge) {
    basePrice += service.cityExtraCharge;
    baseMrp += service.cityExtraCharge;
  }

  return { price: basePrice, mrp: baseMrp, duration };
}

export default function BookingPage() {
  const {
    items,
    quote,
    isQuoting,
    selectedCity,
    setSelectedCity,
    cities,
    updateItemVariant,
    updateItemQty,
    removeItem,
    addItem,
    clearItems,
    couponCode,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    slot,
    setSlot,
    customer,
    setCustomer,
    settings: contextSettings
  } = useBooking();

  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Field validation errors & touched tracking
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Real-time Field Validation & Cleaning Handlers
  const handleNameChange = (e) => {
    const raw = e.target.value;
    // Strictly prevent numbers and symbols - allow only letters and spaces
    const filtered = raw.replace(/[^a-zA-Z\s]/g, '');
    setCustomer(prev => ({ ...prev, name: filtered }));

    if (raw !== filtered) {
      setFieldErrors(prev => ({
        ...prev,
        name: 'Numbers and symbols are not allowed in name.'
      }));
    } else if (filtered.trim().length > 0 && filtered.trim().length < 2) {
      setFieldErrors(prev => ({
        ...prev,
        name: 'Name must be at least 2 characters long.'
      }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    // Only numeric digits, maximum 10 digits
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 10);
    setCustomer(prev => ({ ...prev, phone: digitsOnly }));

    if (digitsOnly.length === 0) {
      setFieldErrors(prev => ({
        ...prev,
        phone: '10-digit mobile number is required.'
      }));
    } else if (digitsOnly.length < 10) {
      setFieldErrors(prev => ({
        ...prev,
        phone: `Mobile number must be 10 digits (${digitsOnly.length}/10 digits entered).`
      }));
    } else if (!/^[6-9]/.test(digitsOnly)) {
      setFieldErrors(prev => ({
        ...prev,
        phone: 'Mobile number must start with 6, 7, 8, or 9.'
      }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const handlePincodeChange = (e) => {
    const raw = e.target.value;
    // 6-digit numeric postal code
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    setAddressForm(prev => ({ ...prev, pincode: digitsOnly }));

    if (digitsOnly.length === 0) {
      setFieldErrors(prev => ({
        ...prev,
        pincode: '6-digit pincode is required.'
      }));
    } else if (digitsOnly.length < 6) {
      setFieldErrors(prev => ({
        ...prev,
        pincode: `Pincode must be exactly 6 digits (${digitsOnly.length}/6 entered).`
      }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.pincode;
        return next;
      });
    }
  };

  const handleLine1Change = (e) => {
    const val = e.target.value;
    setAddressForm(prev => ({ ...prev, line1: val }));

    if (val.trim().length > 0 && val.trim().length < 5) {
      setFieldErrors(prev => ({
        ...prev,
        line1: 'Please enter a complete street address (minimum 5 characters).'
      }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.line1;
        return next;
      });
    }
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setSlot(prev => ({ ...prev, date: val }));
    const today = new Date().toISOString().split('T')[0];

    if (!val) {
      setFieldErrors(prev => ({
        ...prev,
        date: 'Please select a date.'
      }));
    } else if (val < today) {
      setFieldErrors(prev => ({
        ...prev,
        date: 'Booking date cannot be in the past.'
      }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.date;
        return next;
      });
    }
  };

  // All catalog services for the "Add a service" popover
  const [allServices, setAllServices] = useState(FALLBACK_SERVICES);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [inputCoupon, setInputCoupon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address Feature (Saved Address Dropdown vs Temporary Address Checkbox)
  const [isTemporaryAddress, setIsTemporaryAddress] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [addressForm, setAddressForm] = useState({
    line1: '',
    landmark: '',
    cityText: selectedCity?.name || (cities.length > 0 ? (typeof cities[0] === 'string' ? cities[0] : cities[0].name) : ''),
    pincode: '',
    tempText: '' // Used when checkbox is checked
  });

  // Payment Gateway Settings & Dynamic Selection (Default: Cash on Service)
  const [acceptOnlinePayments, setAcceptOnlinePayments] = useState(Boolean(contextSettings?.acceptOnlinePayments));
  const [paymentSettings, setPaymentSettings] = useState(contextSettings || null);
  const [paymentChoice, setPaymentChoice] = useState('cash_on_service'); // 'cash_on_service' | 'online_before'

  // Sync state with contextSettings whenever updated in real-time
  useEffect(() => {
    if (contextSettings) {
      const isOnline = Boolean(contextSettings.acceptOnlinePayments);
      setAcceptOnlinePayments(isOnline);
      setPaymentSettings(contextSettings);
      if (!isOnline && paymentChoice === 'online_before') {
        setPaymentChoice('cash_on_service');
      }
    }
  }, [contextSettings, paymentChoice]);

  // Fetch fresh Public Settings on Mount & Sync across tabs or window focus (always bypass cache to get live DB settings)
  useEffect(() => {
    async function loadPublicSettings() {
      try {
        const res = await apiRequest('/public/settings', { noCache: true });
        if (res && res.success !== false && res.settings) {
          const isOnline = Boolean(res.settings.acceptOnlinePayments);
          setAcceptOnlinePayments(isOnline);
          setPaymentSettings(res.settings);
          if (!isOnline && paymentChoice === 'online_before') {
            setPaymentChoice('cash_on_service');
          }
        }
      } catch (err) {
        console.warn('Failed loading public business settings:', err);
      }
    }
    loadPublicSettings();

    const handleSync = () => {
      loadPublicSettings();
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('max_settings_updated', handleSync);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('max_settings_updated', handleSync);
    };
  }, [paymentChoice]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setCustomer(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || (user.phone?.startsWith('g_') || user.phone?.startsWith('otp_') ? '' : user.phone) || '',
        email: prev.email || user.email || ''
      }));

      if (user.addresses && user.addresses.length > 0 && !selectedSavedAddressId) {
        const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedSavedAddressId(defaultAddr._id);
        setAddressForm(prev => ({
          ...prev,
          line1: defaultAddr.line1,
          landmark: defaultAddr.landmark || '',
          cityText: defaultAddr.city,
          pincode: defaultAddr.pincode
        }));
      }
    }
  }, [user]);

  const { slug } = useParams();

  // Load all services for the "Add a service" selector
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await apiRequest('/services');
        const srvs = (res.success && res.services && res.services.length > 0) ? res.services : FALLBACK_SERVICES;
        setAllServices(srvs);
        if (slug) {
          const matched = srvs.find(s => s.slug === slug);
          if (matched && (!items || items.length === 0 || !items.some(it => it.serviceId === matched._id))) {
            addItem(matched);
          }
        }
      } catch (err) {
        console.warn('Error fetching catalog, using fallback services:', err);
        setAllServices(FALLBACK_SERVICES);
        if (slug) {
          const matched = FALLBACK_SERVICES.find(s => s.slug === slug);
          if (matched && (!items || items.length === 0 || !items.some(it => it.serviceId === matched._id))) {
            addItem(matched);
          }
        }
      }
    }
    loadCatalog();
  }, [slug]);

  // Helper to determine if address inputs are locked to saved address
  const isSavedAddressSelected = !isTemporaryAddress && Boolean(user) && Boolean(selectedSavedAddressId) && selectedSavedAddressId !== 'new';

  // Handle saved address selection change
  const handleSavedAddressChange = (addressId) => {
    setSelectedSavedAddressId(addressId);
    if (addressId === 'new') {
      setAddressForm({
        line1: '',
        landmark: '',
        cityText: selectedCity?.name || (cities.length > 0 ? (typeof cities[0] === 'string' ? cities[0] : cities[0].name) : 'Moradabad'),
        pincode: '',
        tempText: ''
      });
    } else {
      const addr = user?.addresses?.find(a => a._id === addressId);
      if (addr) {
        setAddressForm({
          line1: addr.line1,
          landmark: addr.landmark || '',
          cityText: addr.city,
          pincode: addr.pincode,
          tempText: ''
        });
        const matchedCity = cities.find(c => (typeof c === 'string' ? c : c.name)?.toLowerCase() === addr.city?.toLowerCase());
        if (matchedCity && typeof matchedCity === 'object') {
          setSelectedCity(matchedCity);
        }
      }
    }
  };

  // Toggle temporary address checkbox
  const handleToggleTemporaryAddress = (e) => {
    const checked = e.target.checked;
    setIsTemporaryAddress(checked);
    if (checked) {
      // Clear saved address selection so typing is enabled
      setSelectedSavedAddressId('');
      // Wipe/remove default details so user enters fresh temporary address
      setAddressForm({
        line1: '',
        landmark: '',
        cityText: selectedCity?.name || (cities.length > 0 ? (typeof cities[0] === 'string' ? cities[0] : cities[0].name) : 'Moradabad'),
        pincode: '',
        tempText: ''
      });
    } else {
      // When unchecked, restore default saved address if available
      if (user?.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedSavedAddressId(defaultAddr._id);
        setAddressForm({
          line1: defaultAddr.line1,
          landmark: defaultAddr.landmark || '',
          cityText: defaultAddr.city,
          pincode: defaultAddr.pincode,
          tempText: ''
        });
        const matchedCity = cities.find(c => (typeof c === 'string' ? c : c.name)?.toLowerCase() === defaultAddr.city?.toLowerCase());
        if (matchedCity && typeof matchedCity === 'object') {
          setSelectedCity(matchedCity);
        }
      }
    }
  };

  // Execute Final Booking Record Creation in MongoDB
  const executeBookingCreation = async (paymentDetails = null) => {
    if (!addressForm.line1.trim() || !addressForm.pincode.trim()) {
      toast.error('Please enter complete street address and pincode.');
      return;
    }

    const addressPayload = {
      line1: addressForm.line1.trim(),
      landmark: addressForm.landmark?.trim() || '',
      cityText: addressForm.cityText?.trim() || selectedCity?.name || (cities.length > 0 ? (typeof cities[0] === 'string' ? cities[0] : cities[0].name) : 'Western UP'),
      pincode: addressForm.pincode.trim(),
      isTemporary: Boolean(isTemporaryAddress)
    };

    setIsSubmitting(true);
    try {
      const payload = {
        items: items.map(i => ({
          serviceId: i.service._id,
          selections: i.selections || {},
          qty: i.qty || 1
        })),
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || ''
        },
        citySlug: selectedCity?.slug || (typeof selectedCity === 'string' ? selectedCity.toLowerCase() : (cities[0]?.slug || 'moradabad')),
        address: addressPayload,
        slot,
        notes: customer.notes || '',
        couponCode: couponCode || undefined,
        paymentMode: paymentDetails ? 'online_before' : (paymentChoice || 'cash_on_service'),
        paymentStatus: paymentDetails ? 'paid' : 'pending',
        paymentDetails: paymentDetails || undefined,
        saveAddressToProfile: user ? Boolean(saveAddressToProfile) : false
      };

      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: payload
      });

      if (res.success && res.booking) {
        // Confetti celebration
        try {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        } catch {}

        clearItems();
        toast.success(`Booking confirmed! Order Code: ${res.booking.bookingCode}`);
        navigate(`/track/${res.booking.bookingCode}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Booking Order (Handles Cash on Service vs Online Gateway)
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    // 1. Enforce that only logged in users can use and submit the booking form
    if (!user) {
      toast.error('Please log in or register an account to book your cleaning service.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one service to your booking.');
      return;
    }

    // Verify all cart items are serviceable in the selected city
    const citySlug = (selectedCity?.slug || (selectedCity?.name ? selectedCity.name.toLowerCase() : 'moradabad')).toLowerCase();
    if (citySlug !== 'moradabad') {
      const unsupportedItem = items.find(it => {
        const liveSvc = allServices.find(s => s._id === it.service?._id || s.slug === it.service?.slug) || it.service;
        return !isServiceAvailableInCity(liveSvc, citySlug);
      });

      if (unsupportedItem) {
        toast.error(`"${unsupportedItem.service?.title || 'This service'}" is only available in Moradabad. Please remove it or switch your city to Moradabad.`);
        return;
      }
    }

    // 2. Validate Full Name (No numbers, no symbols, min 2 chars)
    const nameTrimmed = customer.name?.trim() || '';
    if (!nameTrimmed) {
      toast.error('Please provide your full name.');
      setFieldErrors(prev => ({ ...prev, name: 'Full name is required.' }));
      return;
    }
    if (/\d/.test(nameTrimmed)) {
      toast.error('Name cannot contain numbers.');
      setFieldErrors(prev => ({ ...prev, name: 'Numbers are not allowed in name.' }));
      return;
    }
    if (/[^a-zA-Z\s]/.test(nameTrimmed)) {
      toast.error('Name cannot contain symbols or special characters.');
      setFieldErrors(prev => ({ ...prev, name: 'Symbols are not allowed in name.' }));
      return;
    }
    if (nameTrimmed.length < 2) {
      toast.error('Name must be at least 2 characters long.');
      setFieldErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters long.' }));
      return;
    }

    // 3. Validate Mobile Phone (10 digits starting with 6, 7, 8, or 9)
    const phoneDigits = customer.phone ? String(customer.phone).replace(/\D/g, '') : '';
    if (!phoneDigits) {
      toast.error('Please provide your 10-digit mobile number.');
      setFieldErrors(prev => ({ ...prev, phone: '10-digit mobile number is required.' }));
      return;
    }
    if (phoneDigits.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits.');
      setFieldErrors(prev => ({ ...prev, phone: 'Mobile number must be exactly 10 digits.' }));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      toast.error('Mobile number must start with 6, 7, 8, or 9.');
      setFieldErrors(prev => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9.' }));
      return;
    }

    // 4. Validate Street Address
    const line1Trimmed = addressForm.line1?.trim() || '';
    if (!line1Trimmed || line1Trimmed.length < 5) {
      toast.error('Please enter complete street address (minimum 5 characters).');
      setFieldErrors(prev => ({ ...prev, line1: 'Complete street address is required.' }));
      return;
    }

    // 5. Validate 6-Digit Pincode
    const pincodeDigits = addressForm.pincode ? String(addressForm.pincode).replace(/\D/g, '') : '';
    if (pincodeDigits.length !== 6) {
      toast.error('Please enter a valid 6-digit postal pincode.');
      setFieldErrors(prev => ({ ...prev, pincode: 'Valid 6-digit pincode is required.' }));
      return;
    }

    // 6. Validate Booking Date & Time Window
    const today = new Date().toISOString().split('T')[0];
    if (!slot.date || slot.date < today) {
      toast.error('Please select an upcoming date for your cleaning service.');
      setFieldErrors(prev => ({ ...prev, date: 'Please select an upcoming date.' }));
      return;
    }

    if (!slot.window) {
      toast.error('Please select a preferred service time window.');
      return;
    }

    // Cash on Service Choice (Default) OR Online payments disabled by Admin
    if (!acceptOnlinePayments || paymentChoice === 'cash_on_service') {
      await executeBookingCreation(null);
      return;
    }

    // Pay Online Now Chosen via Razorpay
    setIsSubmitting(true);
    try {
      const orderRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: {
          amount: quote?.totals?.total || 1,
          customerName: customer.name.trim(),
          customerPhone: customer.phone.trim(),
          customerEmail: customer.email?.trim() || ''
        }
      });

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Could not initiate online payment order.');
      }

      if (!window.Razorpay) {
        throw new Error('Payment gateway SDK (Razorpay) is still loading. Please check your network or choose Cash on Service.');
      }

      // Live Razorpay Gateway Checkout
      const rzpOptions = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'Max Housekeeping Service',
        description: `Booking reservation payment for ${items.length} service(s)`,
        image: '/logo.png',
        order_id: orderRes.orderId,
        prefill: {
          name: customer.name.trim(),
          contact: customer.phone.trim(),
          email: customer.email?.trim() || ''
        },
        theme: {
          color: '#10231D'
        },
        handler: async function (response) {
          const verifiedDetails = {
            transactionId: response.razorpay_payment_id || `txn_${Date.now()}`,
            orderId: response.razorpay_order_id || orderRes.orderId,
            signature: response.razorpay_signature || 'rzp_verified',
            method: 'razorpay',
            amount: quote?.totals?.total || 0,
            paidAt: new Date()
          };
          await executeBookingCreation(verifiedDetails);
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            toast.info('Online payment was cancelled. You can retry or switch to Cash on Service.');
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', function (resp) {
        setIsSubmitting(false);
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err.message || 'Payment initiation error. Please try Cash on Service.');
    }
  };

  const currentCitySlug = (selectedCity?.slug || (selectedCity?.name ? selectedCity.name.toLowerCase() : 'moradabad')).toLowerCase();
  const isMoradabadSelected = currentCitySlug === 'moradabad';

  const filteredCatalog = allServices.filter(s => {
    // 1. Dynamic city availability filter
    if (!isMoradabadSelected) {
      if (!isServiceAvailableInCity(s, currentCitySlug)) {
        return false;
      }
    }

    // 2. Search query filter
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return true;
    const inTitle = s.title?.toLowerCase().includes(q);
    const inCat = s.categoryName?.toLowerCase().includes(q);
    const inTags = Array.isArray(s.tags) && s.tags.some(t => t.toLowerCase().includes(q));
    const inDesc = s.shortDescription?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    return inTitle || inCat || inTags || inDesc;
  });

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <SEO
        title="Book Cleaning Service"
        description="Book professional cleaning, sofa dry cleaning, and sanitisation services in Moradabad, Rampur, Sambhal, and Western UP with Max Housekeeping Service."
      />
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B] mb-1">
            STEP-BY-STEP RESERVATION
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D]">
            Book Your Cleaning Service
          </h1>
          <p className="text-sm text-[#3D524A] mt-1">
            Service Zone: <strong className="text-[#10231D]">{selectedCity?.name || 'Moradabad'}</strong> (Western UP)
          </p>
        </div>

        {/* Guest Notification Banner */}
        {!user && !isAuthLoading && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0">
                <LuLock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-[#10231D]">
                  Login Required to Place Booking
                </h3>
                <p className="text-xs text-[#3D524A] mt-0.5">
                  Only logged-in customers can complete reservations. You can select services below and log in to confirm your booking.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="px-4 py-2.5 rounded-xl bg-[#10231D] hover:bg-[#1A382F] text-[#F4EFE6] text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <LuLogIn className="w-4 h-4 text-[#E9A23B]" />
              <span>Log In / Sign Up</span>
            </button>
          </div>
        )}

        {/* STEP 0: INITIAL CITY SELECTION & FILTERING BAR */}
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2D9C8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center shrink-0 shadow-xs">
                <LuMapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[#10231D]">
                    Select Your Service City First
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#10231D] text-[#E9A23B] font-mono">
                    {selectedCity?.name || 'Moradabad'}
                  </span>
                </div>
                <p className="text-xs text-[#6B8077] mt-0.5">
                  Catalog and pricing filter instantly. All services are available in Moradabad; Sofa, Carpet & Chair cleaning across other cities.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Select City Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#3D524A] uppercase tracking-wider">
                Quick Select Delivery City:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => {
                const cSlug = (typeof c === 'string' ? c : (c.slug || c.name)).toLowerCase();
                const cName = typeof c === 'string' ? c : (c.name || c.slug);
                const isSelected = (selectedCity?.slug || 'moradabad').toLowerCase() === cSlug;

                return (
                  <button
                    key={cSlug}
                    type="button"
                    onClick={() => {
                      if (typeof c === 'object') {
                        setSelectedCity(c);
                        setAddressForm(prev => ({ ...prev, cityText: c.name }));
                        toast.info(`Switched city to ${c.name}`);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#10231D] text-[#E9A23B] shadow-md ring-2 ring-[#E9A23B]'
                        : 'bg-white hover:bg-[#F4EFE6] text-[#10231D] border border-[#E2D9C8]'
                    }`}
                  >
                    <LuMapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E9A23B]' : 'text-[#6B8077]'}`} />
                    <span>{cName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City Coverage Notice Banner */}
          {isMoradabadSelected ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
                <LuCheck className="w-3 h-3 stroke-[3]" />
              </span>
              <span>
                <strong>Moradabad Operational Hub:</strong> All 25 cleaning services (Full Home Deep Clean, Kitchen, Bathroom, Water Tank, Sofa, Carpet, Marble polishing) are active with zero outstation dispatch surcharge.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <LuTruck className="w-3 h-3 stroke-[2.5]" />
                </span>
                <span>
                  <strong>{selectedCity?.name} Service Zone:</strong> Specialized Sofa Dry Cleaning, Carpet Cleaning, Chair Dry Cleaning, Floor Scrubbing, and Swimming Pool Cleaning are available with doorstep mobile equipment vans. (Full home cleaning is available in Moradabad).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const mbd = cities.find(c => (typeof c === 'string' ? c : c.slug) === 'moradabad') || cities[0];
                  if (mbd && typeof mbd === 'object') {
                    setSelectedCity(mbd);
                    setAddressForm(prev => ({ ...prev, cityText: mbd.name }));
                  }
                }}
                className="text-xs font-bold text-[#10231D] underline hover:text-[#E9A23B] shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Switch to Moradabad
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Column (Steps 1, 2, 3) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* STEP 1: SERVICES (Exact Match to Live Site) */}
            <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2D9C8] mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#10231D] text-[#F4EFE6] text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-display font-bold text-xl text-[#10231D]">
                    Services Selected
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] text-xs font-bold transition-colors"
                >
                  <LuPlus className="w-3.5 h-3.5" />
                  <span>Add a Service</span>
                </button>
              </div>

              {/* Service Items List */}
              {items.length === 0 ? (
                <div className="py-8 text-center text-[#6B8077] border-2 border-dashed border-[#E2D9C8] rounded-xl">
                  <p className="text-sm font-medium">No services added to your booking yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddServiceOpen(true)}
                    className="mt-3 px-4 py-2 rounded-lg bg-[#10231D] text-[#F4EFE6] text-xs font-bold hover:bg-[#3D524A] transition-colors"
                  >
                    Select a Service from Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => {
                    const rawSvc = item.service || {};
                    // Match live service document from catalog for fresh city availability and rates
                    const svc = allServices.find(s => s._id === rawSvc._id || s.slug === rawSvc.slug) || rawSvc;
                    const isUnitService = svc.pricingType === 'unit' && (!svc.matrix || svc.matrix.length === 0);
                    const primaryOptionGroup = svc.optionGroups?.[0];
                    const hasVariants = !isUnitService && ((svc.matrix && svc.matrix.length > 0) || (primaryOptionGroup && primaryOptionGroup.options?.length > 1));
                    const currentVariantKey = item.selections?.[primaryOptionGroup?.key] || primaryOptionGroup?.options?.[0]?.key || '';
                    const currentPriceInfo = getServiceVariantPrice(svc, currentVariantKey, primaryOptionGroup?.key, currentCitySlug, item.selections);
                    
                    const quoteItem = quote?.items?.[idx];
                    const unitPrice = quoteItem?.unitPrice ?? currentPriceInfo.price ?? svc.price ?? 0;
                    const unitMrp = quoteItem?.unitMrp ?? currentPriceInfo.mrp ?? svc.mrp ?? unitPrice;
                    const itemTotal = quoteItem?.totalPrice ?? (unitPrice * (item.qty || 1));
                    const itemMrpTotal = quoteItem?.totalMrp ?? (unitMrp * (item.qty || 1));
                    const itemSavings = quoteItem?.savings ?? Math.max(0, itemMrpTotal - itemTotal);

                    const variantOptions = !isUnitService && primaryOptionGroup ? (primaryOptionGroup.options || []).map((opt) => {
                      const optPriceInfo = getServiceVariantPrice(svc, opt.key, primaryOptionGroup.key, currentCitySlug, item.selections);
                      return {
                        value: opt.key,
                        label: `${opt.label} · ₹${optPriceInfo.price.toLocaleString('en-IN')}`
                      };
                    }) : [];

                    // Dynamic city coverage check
                    const isAllowedInCity = isServiceAvailableInCity(svc, currentCitySlug);

                    return (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-xs space-y-3.5 transition-all"
                      >
                        {/* Outstation Availability Warning if service not serviced in active city */}
                        {!isAllowedInCity && (
                          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span>
                              This service is currently only available for doorstep dispatch in <strong>Moradabad</strong>.
                            </span>
                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const mbd = cities.find(c => (typeof c === 'string' ? c : c.slug) === 'moradabad') || cities[0];
                                  if (mbd && typeof mbd === 'object') {
                                    setSelectedCity(mbd);
                                    setAddressForm(prev => ({ ...prev, cityText: mbd.name }));
                                  }
                                }}
                                className="font-bold underline text-[#10231D] hover:text-[#E9A23B] cursor-pointer"
                              >
                                Switch to Moradabad
                              </button>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="font-bold underline text-[#C2512D] hover:text-[#9A381B] cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Top Row: Service Title & Header Actions (Stepper + Remove) */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-display font-bold text-base text-[#10231D] leading-snug">
                                {svc.title}
                              </h4>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#10231D]/10 text-[#3D524A]">
                                {svc.categoryName || 'Cleaning Service'}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Stepper and Delete Icon */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex items-center border border-[#E2D9C8] rounded-xl bg-[#F4EFE6] overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => updateItemQty(idx, (item.qty || 1) - 1)}
                                className="px-2.5 py-1.5 text-xs font-bold text-[#10231D] hover:bg-[#ECE5D8] transition-colors"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="px-3 text-xs font-bold text-[#10231D] tnum">
                                {item.qty || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateItemQty(idx, (item.qty || 1) + 1)}
                                className="px-2.5 py-1.5 text-xs font-bold text-[#10231D] hover:bg-[#ECE5D8] transition-colors"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-2 text-[#C2512D] hover:bg-[#F9ECE8] rounded-lg transition-colors"
                              aria-label="Remove service"
                              title="Remove service"
                            >
                              <LuTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Middle Row: Area / Unit Calculator OR Normal Variant CustomSelect */}
                        {isUnitService ? (
                          (() => {
                            const unitName = svc.unitLabel || 'Sq. Ft.';
                            const isLitre = svc.pricingUnit === 'litre' || unitName.toLowerCase().includes('ltr') || unitName.toLowerCase().includes('litre');
                            const incrementOptions = isLitre ? [1000, 2500, 5000, 10000] : [50, 100, 200, 500];
                            const currentQty = item.selections?.litres ?? item.selections?.sqFt ?? item.selections?.units ?? currentPriceInfo.minQty ?? (isLitre ? 1000 : 100);

                            return (
                              <div className="pt-2 p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#10231D]">
                                    <LuCalculator className="w-4 h-4 text-[#E9A23B]" />
                                    <span>
                                      {isLitre
                                        ? `Specify Pool / Tank Capacity (${unitName}):`
                                        : `Specify Your Required Area (${unitName}):`}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-bold text-[#3D524A] bg-white px-2.5 py-1 rounded-lg border border-[#E2D9C8] flex items-center gap-1.5">
                                    <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                                    <span>Rate in {selectedCity?.name || 'Moradabad'}:</span>
                                    <strong className="text-[#10231D]">₹{currentPriceInfo.activeRate || svc.price} / {unitName}</strong>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={1}
                                      step="1"
                                      value={currentQty}
                                      onChange={(e) => {
                                        const val = Math.max(1, Number(e.target.value) || 1);
                                        updateItemVariant(idx, {
                                          ...item.selections,
                                          sqFt: val,
                                          units: val,
                                          litres: val
                                        });
                                      }}
                                      className="w-32 p-2 rounded-xl bg-white border border-[#E2D9C8] text-sm font-bold text-[#10231D] text-center focus:border-[#E9A23B] focus:outline-none"
                                    />
                                    <span className="text-xs font-semibold text-[#6B8077]">
                                      {unitName}
                                    </span>
                                  </div>

                                  {/* Quick Increment Buttons */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {incrementOptions.map((inc) => (
                                      <button
                                        key={inc}
                                        type="button"
                                        onClick={() => {
                                          const nextVal = Number(currentQty) + inc;
                                          updateItemVariant(idx, {
                                            ...item.selections,
                                            sqFt: nextVal,
                                            units: nextVal,
                                            litres: nextVal
                                          });
                                        }}
                                        className="px-2 py-1 rounded-lg bg-white hover:bg-[#ECE5D8] border border-[#E2D9C8] text-[11px] font-bold text-[#10231D] transition-colors cursor-pointer"
                                      >
                                        +{inc.toLocaleString('en-IN')}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Minimum Notice if entered amount is below min */}
                                {Number(currentQty) < (currentPriceInfo.minQty || (isLitre ? 1000 : 100)) && (
                                  <div className="text-[11px] text-amber-900 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                                    <LuInfo className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                                    <span>
                                      Minimum chargeable {isLitre ? 'capacity' : 'area'} is {currentPriceInfo.minQty} {unitName}. Billing calculation applied for {currentPriceInfo.minQty} {unitName}.
                                    </span>
                                  </div>
                                )}

                                {/* Live Calculation Formula */}
                                <div className="text-[11px] font-mono text-[#3D524A] bg-white/80 p-2.5 rounded-lg border border-[#E2D9C8]/60 flex items-center justify-between">
                                  <span>
                                    Formula: {currentPriceInfo.effectiveUnits} {unitName} × ₹{currentPriceInfo.activeRate || svc.price}
                                  </span>
                                  <span className="font-bold text-[#10231D] text-xs">
                                    = ₹{currentPriceInfo.price?.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            );
                          })()
                        ) : hasVariants && primaryOptionGroup ? (
                          <div className="pt-1">
                            <label className="block text-xs font-bold text-[#3D524A] mb-1.5">
                              {primaryOptionGroup.label || 'Select Variant / Size'}:
                            </label>
                            <div className="max-w-md">
                              <CustomSelect
                                size="sm"
                                value={currentVariantKey}
                                onChange={(val) => {
                                  updateItemVariant(idx, {
                                    ...item.selections,
                                    [primaryOptionGroup.key]: val
                                  });
                                }}
                                options={variantOptions}
                                placeholder="Choose variant..."
                              />
                            </div>
                          </div>
                        ) : null}

                        {/* Bottom Row: Duration (Left) & Live Price + Savings Pill (Right) */}
                        <div className="pt-2.5 border-t border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            {currentPriceInfo.duration ? (
                              <p className="text-xs text-[#6B8077] flex items-center gap-1.5">
                                <LuClock className="w-3.5 h-3.5 text-[#E9A23B]" />
                                <span>Estimated Duration: <strong className="text-[#10231D]">{currentPriceInfo.duration}</strong></span>
                              </p>
                            ) : (
                              <span className="text-xs text-[#6B8077]">Standard service</span>
                            )}
                          </div>

                          {/* Live Price Readout & Savings Badge */}
                          <div className="flex items-center sm:justify-end gap-2.5 flex-wrap">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-display font-black text-lg text-[#10231D] tnum">
                                ₹{itemTotal.toLocaleString('en-IN')}
                              </span>
                              {itemMrpTotal > itemTotal && (
                                <span className="text-xs text-[#6B8077] line-through tnum">
                                  ₹{itemMrpTotal.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            {itemSavings > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#1B5E20]/15 text-[#1B5E20]">
                                Save ₹{itemSavings.toLocaleString('en-IN')} ({Math.round((itemSavings / itemMrpTotal) * 100)}% OFF)
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#6B8077]">
                                ₹{unitPrice.toLocaleString('en-IN')} / unit
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 2: ADDRESS (With Saved Dropdown & Temporary Checkbox) */}
            <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2D9C8] mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#10231D] text-[#F4EFE6] text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <h2 className="font-display font-bold text-xl text-[#10231D]">
                    Service Location & Address
                  </h2>
                </div>
                {user ? (
                  <Link to="/dashboard" className="text-xs font-bold text-[#10231D] underline hover:text-[#E9A23B] flex items-center gap-1">
                    <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>My Address Book</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    className="text-xs font-bold text-[#10231D] underline hover:text-[#E9A23B] flex items-center gap-1 cursor-pointer"
                  >
                    <LuLock className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Log in to use saved addresses</span>
                  </button>
                )}
              </div>

              {!user && !isAuthLoading && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-[#3D524A]">
                    <LuLock className="w-4 h-4 text-[#10231D] shrink-0" />
                    <span>
                      Please log in to enter your address or select from your saved addresses.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    className="px-3.5 py-1.5 rounded-lg bg-[#10231D] text-[#F4EFE6] font-bold text-xs hover:bg-[#3D524A] transition-colors shrink-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              )}

              {/* Saved Address Dropdown (If authenticated with addresses and NOT using temporary address) */}
              {user && user.addresses && user.addresses.length > 0 && !isTemporaryAddress ? (
                <div className="mb-4 p-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#10231D]">
                      Select from Your Saved Addresses:
                    </label>
                    {isSavedAddressSelected && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <LuCheck className="w-3 h-3 text-emerald-700" />
                        <span>Address Selected & Locked</span>
                      </span>
                    )}
                  </div>
                  <CustomSelect
                    value={selectedSavedAddressId}
                    onChange={(val) => handleSavedAddressChange(val)}
                    options={[
                      ...user.addresses.map((a) => ({
                        value: a._id,
                        label: `${a.label || 'Home'}: ${a.line1}, ${a.city} (${a.pincode})${a.isDefault ? ' (Default)' : ''}`
                      })),
                      { value: 'new', label: '+ Enter a different address' }
                    ]}
                    placeholder="Choose from Saved Addresses..."
                  />
                </div>
              ) : user && (!user.addresses || user.addresses.length === 0) && !isTemporaryAddress ? (
                <div className="mb-4 p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] flex items-center justify-between text-xs">
                  <span className="text-[#6B8077] flex items-center gap-1.5">
                    <LuInfo className="w-3.5 h-3.5 text-[#3D524A] shrink-0" />
                    <span>No saved addresses yet. Enter your address below and it will be saved to your profile!</span>
                  </span>
                  <Link to="/dashboard" className="font-bold text-[#10231D] underline hover:text-[#E9A23B] shrink-0 ml-2">
                    Manage in Dashboard
                  </Link>
                </div>
              ) : null}

              {/* Temporary Address Checkbox requested by user */}
              <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                <input
                  type="checkbox"
                  id="tempAddressToggle"
                  disabled={!user}
                  checked={isTemporaryAddress}
                  onChange={handleToggleTemporaryAddress}
                  className="w-4 h-4 rounded border-[#3D524A] text-[#E9A23B] focus:ring-[#E9A23B] cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="tempAddressToggle" className="text-xs font-bold text-[#10231D] cursor-pointer select-none">
                  Use temporary address (Do not save to my profile address book)
                </label>
              </div>

              {/* Address Fields: Typing disabled in case of saved address, allowed for temporary or new address */}
              <div className="space-y-4">
                {isSavedAddressSelected && (
                  <div className="p-2.5 rounded-xl bg-[#ECE5D8] border border-[#D2C8B8] flex items-center gap-2 text-xs text-[#3D524A]">
                    <LuShieldCheck className="w-4 h-4 text-[#10231D] shrink-0" />
                    <span>
                      Address details locked from your saved profile. To edit or enter a different location, select <strong>"+ Enter a different address"</strong> or check <strong>"Use temporary address"</strong> above.
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#10231D]">
                      Street Address / House No. / Flat / Society: <span className="text-[#C2512D]">*</span>
                    </label>
                    <span className="text-[10px] text-[#6B8077]">Min. 5 characters</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Flat 302, Green Valley Apartments"
                      value={addressForm.line1}
                      readOnly={isSavedAddressSelected}
                      disabled={isSavedAddressSelected || !user}
                      onChange={handleLine1Change}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, line1: true }))}
                      className={`w-full p-3 rounded-xl border text-sm transition-colors ${
                        isSavedAddressSelected || !user
                          ? 'bg-[#ECE5D8]/70 border-[#D2C8B8] text-[#10231D] cursor-not-allowed select-none'
                          : fieldErrors.line1 && (touchedFields.line1 || addressForm.line1.length > 0)
                          ? 'bg-[#F9ECE8] border-[#C2512D] text-[#10231D] focus:border-[#C2512D] focus:ring-1 focus:ring-[#C2512D] focus:outline-none'
                          : 'bg-[#F4EFE6] border-[#E2D9C8] text-[#10231D] focus:border-[#E9A23B] focus:outline-none'
                      }`}
                      required
                    />
                    {fieldErrors.line1 && (touchedFields.line1 || addressForm.line1.length > 0) && !isSavedAddressSelected && (
                      <LuCircleAlert className="w-4 h-4 text-[#C2512D] absolute right-3 top-3.5" />
                    )}
                  </div>
                  {fieldErrors.line1 && (touchedFields.line1 || addressForm.line1.length > 0) && !isSavedAddressSelected && (
                    <p className="text-[11px] font-semibold text-[#C2512D] mt-1 flex items-center gap-1">
                      <span>{fieldErrors.line1}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      Service City:
                    </label>
                    {isSavedAddressSelected || !user ? (
                      <input
                        type="text"
                        value={addressForm.cityText}
                        readOnly
                        disabled
                        className="w-full p-2.5 rounded-xl border bg-[#ECE5D8]/70 border-[#D2C8B8] text-sm text-[#10231D] cursor-not-allowed select-none"
                      />
                    ) : (
                      <CustomSelect
                        value={addressForm.cityText}
                        onChange={(val) => {
                          setAddressForm({ ...addressForm, cityText: val });
                          const matchedCity = cities.find(c => (typeof c === 'string' ? c : c.name) === val);
                          if (matchedCity && typeof matchedCity === 'object') {
                            setSelectedCity(matchedCity);
                          }
                        }}
                        options={cities.map(c => {
                          const name = typeof c === 'string' ? c : (c.name || c.slug);
                          return { value: name, label: name };
                        })}
                        placeholder="Select City..."
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      Landmark (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Water Tank"
                      value={addressForm.landmark}
                      readOnly={isSavedAddressSelected}
                      disabled={isSavedAddressSelected || !user}
                      onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border text-sm transition-colors ${
                        isSavedAddressSelected || !user
                          ? 'bg-[#ECE5D8]/70 border-[#D2C8B8] text-[#10231D] cursor-not-allowed select-none'
                          : 'bg-[#F4EFE6] border-[#E2D9C8] text-[#10231D] focus:border-[#E9A23B] focus:outline-none'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#10231D]">
                        6-Digit Pincode: <span className="text-[#C2512D]">*</span>
                      </label>
                      {addressForm.pincode && (
                        <span className="text-[10px] text-[#6B8077]">{addressForm.pincode.length}/6</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 244001"
                        maxLength={6}
                        value={addressForm.pincode}
                        readOnly={isSavedAddressSelected}
                        disabled={isSavedAddressSelected || !user}
                        onChange={handlePincodeChange}
                        onBlur={() => setTouchedFields(prev => ({ ...prev, pincode: true }))}
                        className={`w-full p-2.5 rounded-xl border text-sm font-mono transition-colors ${
                          isSavedAddressSelected || !user
                            ? 'bg-[#ECE5D8]/70 border-[#D2C8B8] text-[#10231D] cursor-not-allowed select-none'
                            : fieldErrors.pincode && (touchedFields.pincode || addressForm.pincode.length > 0)
                            ? 'bg-[#F9ECE8] border-[#C2512D] text-[#10231D] focus:border-[#C2512D] focus:ring-1 focus:ring-[#C2512D] focus:outline-none'
                            : 'bg-[#F4EFE6] border-[#E2D9C8] text-[#10231D] focus:border-[#E9A23B] focus:outline-none'
                        }`}
                        required
                      />
                      {fieldErrors.pincode && (touchedFields.pincode || addressForm.pincode.length > 0) && !isSavedAddressSelected && (
                        <LuCircleAlert className="w-4 h-4 text-[#C2512D] absolute right-3 top-3" />
                      )}
                    </div>
                    {fieldErrors.pincode && (touchedFields.pincode || addressForm.pincode.length > 0) && !isSavedAddressSelected && (
                      <p className="text-[11px] font-semibold text-[#C2512D] mt-1">
                        {fieldErrors.pincode}
                      </p>
                    )}
                  </div>
                </div>

                {user && !isTemporaryAddress && (!selectedSavedAddressId || selectedSavedAddressId === 'new') && (
                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveAddressCheck"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="w-4 h-4 rounded border-[#3D524A] text-[#E9A23B] focus:ring-[#E9A23B] cursor-pointer"
                    />
                    <label htmlFor="saveAddressCheck" className="text-xs text-[#3D524A] cursor-pointer select-none">
                      Save this address to my profile address book for future bookings
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: SCHEDULE SLOT & CONTACT */}
            <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2D9C8] mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#10231D] text-[#F4EFE6] text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <h2 className="font-display font-bold text-xl text-[#10231D]">
                    Service Schedule & Contact
                  </h2>
                </div>
                {!user && (
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    className="text-xs font-bold text-[#10231D] underline hover:text-[#E9A23B] flex items-center gap-1 cursor-pointer"
                  >
                    <LuLock className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>Log in to enter contact</span>
                  </button>
                )}
              </div>

              {!user && !isAuthLoading && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#3D524A]">
                    <LuLock className="w-4 h-4 text-[#10231D] shrink-0" />
                    <span>
                      Please log in to set contact details and schedule. Your saved profile name and phone will automatically pre-fill.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    className="px-3.5 py-1.5 rounded-lg bg-[#10231D] text-[#F4EFE6] font-bold text-xs hover:bg-[#3D524A] transition-colors shrink-0 cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#10231D]">
                      Select Date: <span className="text-[#C2512D]">*</span>
                    </label>
                  </div>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={slot.date}
                    disabled={!user}
                    onChange={handleDateChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, date: true }))}
                    className={`w-full p-3 rounded-xl border text-sm transition-colors ${
                      !user
                        ? 'bg-[#ECE5D8]/70 border-[#D2C8B8] text-[#6B8077] cursor-not-allowed select-none'
                        : fieldErrors.date
                        ? 'bg-[#F9ECE8] border-[#C2512D] text-[#10231D] focus:border-[#C2512D] focus:ring-1 focus:ring-[#C2512D] focus:outline-none'
                        : 'bg-[#F4EFE6] border-[#E2D9C8] text-[#10231D] focus:border-[#E9A23B] focus:outline-none'
                    }`}
                    required
                  />
                  {fieldErrors.date && (
                    <p className="text-[11px] font-semibold text-[#C2512D] mt-1">
                      {fieldErrors.date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Preferred Time Window: <span className="text-[#C2512D]">*</span>
                  </label>
                  {user ? (
                    <CustomSelect
                      value={slot.window}
                      onChange={(val) => setSlot({ ...slot, window: val })}
                      options={[
                        { value: 'Morning (8:00 AM – 11:00 AM)', label: 'Morning (8:00 AM – 11:00 AM)' },
                        { value: 'Midday (11:00 AM – 2:00 PM)', label: 'Midday (11:00 AM – 2:00 PM)' },
                        { value: 'Afternoon (2:00 PM – 5:00 PM)', label: 'Afternoon (2:00 PM – 5:00 PM)' },
                        { value: 'Evening (5:00 PM – 8:00 PM)', label: 'Evening (5:00 PM – 8:00 PM)' }
                      ]}
                      placeholder="Select Time Window..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={slot.window}
                      disabled
                      readOnly
                      className="w-full p-3 rounded-xl border bg-[#ECE5D8]/70 border-[#D2C8B8] text-sm text-[#6B8077] cursor-not-allowed select-none"
                    />
                  )}
                </div>
              </div>

              {/* Customer Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#10231D]">
                      Full Name: <span className="text-[#C2512D]">*</span>
                    </label>
                    <span className="text-[10px] text-[#6B8077]">Letters & spaces only</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={customer.name}
                      disabled={!user}
                      onChange={handleNameChange}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, name: true }))}
                      className={`w-full p-3 rounded-xl border text-sm transition-colors ${
                        !user
                          ? 'bg-[#ECE5D8]/70 border-[#D2C8B8] text-[#6B8077] cursor-not-allowed select-none'
                          : fieldErrors.name && (touchedFields.name || customer.name.length > 0)
                          ? 'bg-[#F9ECE8] border-[#C2512D] text-[#10231D] focus:border-[#C2512D] focus:ring-1 focus:ring-[#C2512D] focus:outline-none'
                          : 'bg-[#F4EFE6] border-[#E2D9C8] text-[#10231D] focus:border-[#E9A23B] focus:outline-none'
                      }`}
                      required
                    />
                    {fieldErrors.name && (touchedFields.name || customer.name.length > 0) && (
                      <LuCircleAlert className="w-4 h-4 text-[#C2512D] absolute right-3 top-3.5" />
                    )}
                  </div>
                  {fieldErrors.name && (touchedFields.name || customer.name.length > 0) && (
                    <p className="text-[11px] font-semibold text-[#C2512D] mt-1 flex items-center gap-1">
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#10231D]">
                      WhatsApp / Mobile Number: <span className="text-[#C2512D]">*</span>
                    </label>
                    <span className="text-[10px] text-[#6B8077]">
                      {customer.phone ? `${customer.phone.length}/10 digits` : '10 digits'}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#6B8077] select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={customer.phone}
                      disabled={!user}
                      onChange={handlePhoneChange}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, phone: true }))}
                      className={`w-full pl-11 pr-3 py-3 rounded-xl border text-sm font-mono transition-colors ${
                        !user
                          ? 'bg-[#ECE5D8]/70 border-[#D2C8B8] text-[#6B8077] cursor-not-allowed select-none'
                          : fieldErrors.phone && (touchedFields.phone || customer.phone.length > 0)
                          ? 'bg-[#F9ECE8] border-[#C2512D] text-[#10231D] focus:border-[#C2512D] focus:ring-1 focus:ring-[#C2512D] focus:outline-none'
                          : 'bg-[#F4EFE6] border-[#E2D9C8] text-[#10231D] focus:border-[#E9A23B] focus:outline-none'
                      }`}
                      required
                    />
                    {fieldErrors.phone && (touchedFields.phone || customer.phone.length > 0) && (
                      <LuCircleAlert className="w-4 h-4 text-[#C2512D] absolute right-3" />
                    )}
                  </div>
                  {fieldErrors.phone && (touchedFields.phone || customer.phone.length > 0) && (
                    <p className="text-[11px] font-semibold text-[#C2512D] mt-1 flex items-center gap-1">
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Perforated Job Ticket */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="rounded-2xl border-2 border-[#10231D] bg-[#ECE5D8] shadow-2xl overflow-hidden">
              {/* Perforated Top Header */}
              <div className="p-6 bg-[#10231D] text-[#F4EFE6]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] tracking-widest text-[#E9A23B] uppercase">
                      JOB TICKET SUMMARY
                    </span>
                    <h3 className="font-display font-black text-xl text-[#F4EFE6]">
                      Max Housekeeping
                    </h3>
                  </div>
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Items Line Breakdown */}
                <div className="divide-y divide-[#E2D9C8]">
                  {quote?.items && quote.items.length > 0 ? (
                    quote.items.map((it, i) => (
                      <div key={i} className="py-2.5 flex items-baseline justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#10231D]">{it.title}</p>
                          <p className="text-[#6B8077]">{it.selections?.size || it.duration || ''} · Qty {it.qty}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#10231D] tnum">
                            ₹{it.totalPrice?.toLocaleString('en-IN')}
                          </span>
                          {it.totalMrp > it.totalPrice && (
                            <span className="block text-[10px] text-[#6B8077] line-through tnum">
                              ₹{it.totalMrp?.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-xs text-center text-[#6B8077]">
                      Add services above to see itemized breakdown.
                    </p>
                  )}
                </div>

                {/* Coupon Code Input */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon (e.g. WELCOME10)"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      className="flex-1 p-2 rounded-lg bg-[#F4EFE6] border border-[#E2D9C8] text-xs font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon(inputCoupon)}
                      className="px-3 py-2 rounded-lg bg-[#10231D] text-[#F4EFE6] text-xs font-bold hover:bg-[#3D524A]"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between text-xs text-[#10231D] bg-[#DDEBE4] px-2.5 py-1.5 rounded-lg border border-[#BED6CC]">
                      <span>Code <strong>{appliedCoupon.code}</strong> applied</span>
                      <button type="button" onClick={removeCoupon} className="text-[#C2512D] font-bold">
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals Breakdown with Dual-Pricing */}
                <div className="pt-4 border-t border-[#E2D9C8] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6B8077]">
                    <span>Shown Price (MRP):</span>
                    <span className="line-through tnum">
                      ₹{(quote?.totals?.mrpTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#10231D]">
                    <span>Service Subtotal:</span>
                    <span className="font-bold tnum">
                      ₹{(quote?.totals?.subtotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {quote?.totals?.couponDiscount > 0 && (
                    <div className="flex justify-between text-[#C2512D] font-bold">
                      <span>Coupon Discount:</span>
                      <span className="tnum">-₹{quote.totals.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-[#10231D] flex justify-between items-baseline">
                    <span className="font-display font-extrabold text-base text-[#10231D]">
                      Payable Amount:
                    </span>
                    <span className="font-display font-black text-2xl text-[#10231D] tnum">
                      ₹{(quote?.totals?.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Savings Callout Pill */}
                  {(quote?.totals?.customerSaved || 0) > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#F9ECE8] border border-[#C2512D]/30 text-center text-xs font-black text-[#C2512D] tracking-wide mt-2">
                      You save ₹{quote.totals.customerSaved.toLocaleString('en-IN')} ({quote.totals.overallDiscountPct}% OFF)!
                    </div>
                  )}
                </div>

                {/* Payment Option Selection */}
                {acceptOnlinePayments ? (
                  <div className="pt-3 border-t border-[#E2D9C8] space-y-2.5">
                    <span className="block text-xs font-bold text-[#10231D]">
                      Payment Method:
                    </span>

                    <div className="space-y-2">
                      {/* Cash on Service */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          paymentChoice === 'cash_on_service'
                            ? 'bg-[#F4EFE6] border-[#10231D] ring-1 ring-[#10231D] shadow-xs'
                            : 'bg-[#F4EFE6]/60 border-[#E2D9C8] hover:bg-[#F4EFE6]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentChoice"
                          value="cash_on_service"
                          checked={paymentChoice === 'cash_on_service'}
                          onChange={() => setPaymentChoice('cash_on_service')}
                          className="mt-0.5 text-[#10231D] focus:ring-[#10231D] w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                              <LuBanknote className="w-4 h-4 text-[#3D524A]" />
                              Pay on Service Completion
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3D524A] bg-[#ECE5D8] px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B8077] mt-0.5">
                            Pay via Cash or UPI to cleaning crew after the job is completed.
                          </p>
                        </div>
                      </label>

                      {/* Pay Online Now */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          paymentChoice === 'online_before'
                            ? 'bg-[#F4EFE6] border-[#E9A23B] ring-2 ring-[#E9A23B] shadow-xs'
                            : 'bg-[#F4EFE6]/60 border-[#E2D9C8] hover:bg-[#F4EFE6]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentChoice"
                          value="online_before"
                          checked={paymentChoice === 'online_before'}
                          onChange={() => setPaymentChoice('online_before')}
                          className="mt-0.5 text-[#E9A23B] focus:ring-[#E9A23B] w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#10231D] flex items-center gap-1.5">
                              <LuCreditCard className="w-4 h-4 text-[#E9A23B]" />
                              Pay Online Now (Razorpay)
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              UPI · Cards
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B8077] mt-0.5">
                            Instant online payment via UPI, Credit/Debit Cards, or NetBanking.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-xs text-[#6B8077] flex items-center gap-1.5">
                    <LuShieldCheck className="w-4 h-4 text-[#10231D]" />
                    <span>Payment Mode: <strong>Cash / UPI upon service completion</strong></span>
                  </div>
                )}

                {/* Submit Booking Button or Login Redirect Button */}
                {!user ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#D2C8B8] flex items-start gap-2.5 text-xs text-[#3D524A]">
                      <LuLock className="w-4 h-4 text-[#10231D] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#10231D]">Account Login Required</p>
                        <p className="text-[11px] text-[#6B8077] mt-0.5">
                          Only registered customers can confirm reservations. Sign in to your account to complete this booking.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/login', { state: { from: location.pathname } })}
                      className="w-full py-4 rounded-xl bg-[#10231D] hover:bg-[#1A382F] text-[#F4EFE6] font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <LuLogIn className="w-5 h-5 text-[#E9A23B] group-hover:translate-x-0.5 transition-transform" />
                      <span>Log In to Confirm Booking</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full py-4 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      'Processing Reservation...'
                    ) : paymentChoice === 'online_before' && acceptOnlinePayments ? (
                      <>
                        <LuCreditCard className="w-5 h-5" />
                        <span>Pay ₹{(quote?.totals?.total || 0).toLocaleString('en-IN')} & Confirm</span>
                      </>
                    ) : (
                      <span>Confirm Cleaning Booking (Pay Later)</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Modal: Add a Service Popover */}
        <Modal
          isOpen={isAddServiceOpen}
          onClose={() => setIsAddServiceOpen(false)}
          title="Add a Service to Booking"
          subtitle="Select from specialized home, upholstery and commercial packages"
          maxWidth="max-w-xl"
        >
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search services (e.g. sofa, kitchen, 2 BHK, bathroom)..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] text-sm focus:border-[#E9A23B] focus:outline-none"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filteredCatalog.map((s) => (
              <div
                key={s._id}
                className="p-3 rounded-xl bg-[#ECE5D8]/70 hover:bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <p className="font-bold text-sm text-[#10231D]">{s.title}</p>
                  <p className="text-xs text-[#6B8077]">{s.categoryName} · {s.duration || '1 hr'}</p>
                  <p className="text-xs font-bold text-[#10231D] mt-1 tnum">
                    {s.pricingType === 'unit'
                      ? `₹${s.unitRateMoradabad || s.price} / ${s.pricingUnit === 'sq_ft' ? 'Sq. Ft.' : (s.unitLabel || 'unit')}`
                      : `From ₹${s.price.toLocaleString('en-IN')}`}
                    {s.mrp > s.price && s.pricingType !== 'unit' && (
                      <span className="ml-1.5 text-[11px] text-[#6B8077] line-through">
                        ₹{s.mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const defaultSelection = {};
                    if (s.optionGroups?.[0]?.key) {
                      const defaultOpt = s.optionGroups[0].options?.find(o => o.isDefault) || s.optionGroups[0].options?.[0];
                      if (defaultOpt) {
                        defaultSelection[s.optionGroups[0].key] = defaultOpt.key;
                      }
                    }
                    addItem(s, defaultSelection, 1);
                    setIsAddServiceOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#E9A23B] text-[#10231D] text-xs font-bold hover:bg-[#D48E28] transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </Modal>

      </div>
    </div>
  );
}
