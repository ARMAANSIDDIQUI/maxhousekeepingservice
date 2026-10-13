import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  LuUser
} from 'react-icons/lu';
import confetti from 'canvas-confetti';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest, FALLBACK_SERVICES } from '../api';
import Modal from '../components/common/Modal';

export default function BookingPage() {
  const {
    items,
    quote,
    isQuoting,
    selectedCity,
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
    setCustomer
  } = useBooking();

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // All catalog services for the "Add a service" popover
  const [allServices, setAllServices] = useState(FALLBACK_SERVICES);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [inputCoupon, setInputCoupon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address Feature (Saved Address Dropdown vs Temporary Address Checkbox)
  const [isTemporaryAddress, setIsTemporaryAddress] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState({
    line1: '',
    landmark: '',
    cityText: selectedCity?.name || 'Moradabad',
    pincode: '',
    tempText: '' // Used when checkbox is checked
  });

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

  // Handle saved address selection change
  const handleSavedAddressChange = (addressId) => {
    setSelectedSavedAddressId(addressId);
    if (addressId === 'new') {
      setAddressForm({
        line1: '',
        landmark: '',
        cityText: selectedCity?.name || 'Moradabad',
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
      }
    }
  };

  // Submit Booking Order
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Please add at least one service to your booking.');
      return;
    }

    if (!customer.name.trim() || !customer.phone.trim()) {
      toast.error('Please provide your name and mobile number.');
      return;
    }

    // Prepare address payload based on temporary checkbox
    let addressPayload;
    if (isTemporaryAddress) {
      if (!addressForm.tempText.trim()) {
        toast.error('Please type your temporary service address.');
        return;
      }
      addressPayload = {
        line1: addressForm.tempText.trim(),
        cityText: selectedCity?.name || 'Moradabad',
        pincode: '244001',
        isTemporary: true
      };
    } else {
      if (!addressForm.line1.trim() || !addressForm.pincode.trim()) {
        toast.error('Please enter street address and pincode.');
        return;
      }
      addressPayload = {
        line1: addressForm.line1.trim(),
        landmark: addressForm.landmark?.trim() || '',
        cityText: addressForm.cityText?.trim() || selectedCity?.name || 'Moradabad',
        pincode: addressForm.pincode.trim(),
        isTemporary: false
      };
    }

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
        citySlug: selectedCity?.slug || 'moradabad',
        address: addressPayload,
        slot,
        notes: customer.notes || '',
        couponCode: couponCode || undefined,
        paymentMode: 'cash_on_service'
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

  const filteredCatalog = allServices.filter(s =>
    s.title.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.categoryName?.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
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
                    const svc = item.service;
                    const hasVariants = svc.matrix && svc.matrix.length > 0;
                    const primaryOptionGroup = svc.optionGroups?.[0];

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <h4 className="font-display font-bold text-base text-[#10231D]">
                            {svc.title}
                          </h4>
                          <p className="text-xs text-[#6B8077]">
                            {svc.categoryName || 'Cleaning Service'}
                          </p>

                          {/* Interactive Variant Dropdown Selector INSIDE row */}
                          {hasVariants && primaryOptionGroup && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="text-xs font-medium text-[#3D524A]">Variant:</span>
                              <select
                                value={item.selections?.[primaryOptionGroup.key] || ''}
                                onChange={(e) => {
                                  updateItemVariant(idx, {
                                    ...item.selections,
                                    [primaryOptionGroup.key]: e.target.value
                                  });
                                }}
                                className="theme-select text-xs py-1 px-2.5 bg-[#ECE5D8] border-[#E2D9C8]"
                              >
                                {primaryOptionGroup.options.map((opt) => (
                                  <option key={opt.key} value={opt.key}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Quantity and Actions */}
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-[#E2D9C8] rounded-lg bg-[#ECE5D8] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, (item.qty || 1) - 1)}
                              className="px-2.5 py-1 text-sm font-bold text-[#10231D] hover:bg-[#E2D9C8]"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-bold tnum">
                              {item.qty || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, (item.qty || 1) + 1)}
                              className="px-2.5 py-1 text-sm font-bold text-[#10231D] hover:bg-[#E2D9C8]"
                            >
                              +
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-[#C2512D] hover:bg-[#F9ECE8] rounded-md transition-colors"
                            aria-label="Remove service"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 2: ADDRESS (With Saved Dropdown & Temporary Checkbox) */}
            <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2D9C8] mb-5">
                <span className="w-7 h-7 rounded-full bg-[#10231D] text-[#F4EFE6] text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="font-display font-bold text-xl text-[#10231D]">
                  Service Location & Address
                </h2>
              </div>

              {/* Saved Address Dropdown (If authenticated with addresses) */}
              {user && user.addresses && user.addresses.length > 0 && !isTemporaryAddress && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-[#10231D] mb-1.5">
                    Choose from Saved Addresses:
                  </label>
                  <select
                    value={selectedSavedAddressId}
                    onChange={(e) => handleSavedAddressChange(e.target.value)}
                    className="w-full theme-select bg-[#F4EFE6]"
                  >
                    {user.addresses.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.label || 'Home'}: {a.line1}, {a.city} ({a.pincode})
                      </option>
                    ))}
                    <option value="new">+ Add a different address</option>
                  </select>
                </div>
              )}

              {/* Temporary Address Checkbox requested by user */}
              <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8]">
                <input
                  type="checkbox"
                  id="tempAddressToggle"
                  checked={isTemporaryAddress}
                  onChange={(e) => setIsTemporaryAddress(e.target.checked)}
                  className="w-4 h-4 rounded border-[#3D524A] text-[#E9A23B] focus:ring-[#E9A23B] cursor-pointer"
                />
                <label htmlFor="tempAddressToggle" className="text-xs font-bold text-[#10231D] cursor-pointer select-none">
                  Use temporary address (Do not save to my profile address book)
                </label>
              </div>

              {/* Conditional Inputs based on Checkbox */}
              {isTemporaryAddress ? (
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Temporary Address Details:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter complete temporary address (flat/house no, building, street, landmark)..."
                    value={addressForm.tempText}
                    onChange={(e) => setAddressForm({ ...addressForm, tempText: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-[#6B8077] mt-1">
                    This temporary address will only be used for this specific booking.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10231D] mb-1">
                      Street Address / House No. / Society:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 302, Green Valley Apartments"
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#10231D] mb-1">
                        Landmark (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near Water Tank"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#10231D] mb-1">
                        6-Digit Pincode:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 244001"
                        maxLength={6}
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: SCHEDULE SLOT & CONTACT */}
            <div className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] shadow-sm">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2D9C8] mb-5">
                <span className="w-7 h-7 rounded-full bg-[#10231D] text-[#F4EFE6] text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="font-display font-bold text-xl text-[#10231D]">
                  Service Schedule & Contact
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Select Date:
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={slot.date}
                    onChange={(e) => setSlot({ ...slot, date: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Preferred Time Window:
                  </label>
                  <select
                    value={slot.window}
                    onChange={(e) => setSlot({ ...slot, window: e.target.value })}
                    className="w-full theme-select bg-[#F4EFE6]"
                  >
                    <option value="Morning (8:00 AM – 11:00 AM)">Morning (8:00 AM – 11:00 AM)</option>
                    <option value="Midday (11:00 AM – 2:00 PM)">Midday (11:00 AM – 2:00 PM)</option>
                    <option value="Afternoon (2:00 PM – 5:00 PM)">Afternoon (2:00 PM – 5:00 PM)</option>
                    <option value="Evening (5:00 PM – 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Customer Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10231D] mb-1">
                    WhatsApp / Mobile Number:
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D]"
                    required
                  />
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

                {/* Payment Option */}
                <div className="pt-2 text-xs text-[#6B8077] flex items-center gap-1.5">
                  <LuShieldCheck className="w-4 h-4 text-[#10231D]" />
                  <span>Payment Mode: <strong>Cash / UPI upon service completion</strong></span>
                </div>

                {/* Submit Booking Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full py-4 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] disabled:opacity-50 text-[#10231D] font-black text-base shadow-lg transition-transform active:scale-95"
                >
                  {isSubmitting ? 'Confirming Reservation...' : 'Confirm Cleaning Booking'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Modal: Add a Service Popover */}
        <Modal
          isOpen={isAddServiceOpen}
          onClose={() => setIsAddServiceOpen(false)}
          title="Add a Service to Booking"
          subtitle="Select from 37+ specialized home and commercial packages"
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
                    From ₹{s.price.toLocaleString('en-IN')}
                    {s.mrp > s.price && (
                      <span className="ml-1.5 text-[11px] text-[#6B8077] line-through">
                        ₹{s.mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addItem(s, {}, 1);
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
