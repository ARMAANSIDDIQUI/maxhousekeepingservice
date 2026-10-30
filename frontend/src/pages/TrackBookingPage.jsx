import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LuSearch,
  LuCalendar,
  LuMapPin,
  LuClock,
  LuPhone,
  LuShieldCheck,
  LuCircleAlert,
  LuCheck,
  LuCreditCard,
  LuBanknote,
  LuCamera,
  LuSparkles,
  LuCopy
} from 'react-icons/lu';
import { apiRequest } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useBooking } from '../context/BookingContext';
import { FaInstagram } from 'react-icons/fa6';
import SEO from '../components/common/SEO';
import LiveTrackingRadar from '../components/common/LiveTrackingRadar';
import { calculateDistanceKm, getEtaInfo } from '../utils/geoUtils';

import { formatDateDMY } from '../utils/date';

export default function TrackBookingPage() {
  const { settings } = useBooking();
  const { code } = useParams();
  const [searchCode, setSearchCode] = useState(code || '');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (code) {
      lookupBooking(code);
    }
  }, [code]);

  const lookupBooking = async (targetCode) => {
    if (!targetCode?.trim()) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/bookings/track/${targetCode.trim().toUpperCase()}`);
      if (res.success && res.booking) {
        setBooking(res.booking);
      }
    } catch (err) {
      toast.error('Booking not found with this code.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    lookupBooking(searchCode);
  };

  const handleCopyOtp = (otp) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    toast.success('Verification OTP copied to clipboard!');
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const steps = [
    { key: 'pending', label: 'Booking Received' },
    { key: 'confirmed', label: 'Confirmed & Team Assigned' },
    { key: 'in_progress', label: 'Cleaning in Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  const currentStepIdx = booking ? steps.findIndex(s => s.key === booking.status) : -1;

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-12">
      <SEO
        title="Track Your Cleaning Order"
        description="Track your real-time booking status, supervisor allotment, OTP verification, and inspection photos with Max Housekeeping Service."
      />
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
            ORDER STATUS & TRACKING
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D] mt-1">
            Track Your Cleaning Order
          </h1>
          <p className="text-xs text-[#6B8077] mt-1">
            Enter your booking reference code (e.g. MH-2026-8921)
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-10 max-w-md mx-auto">
          <input
            type="text"
            placeholder="MH-2026-XXXX"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            className="flex-1 p-3.5 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] font-mono text-sm uppercase text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-sm shadow-md cursor-pointer"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Booking Details Card */}
        {booking && (
          <div className="bg-[#ECE5D8] p-6 sm:p-8 rounded-3xl border-2 border-[#10231D] shadow-xl space-y-6">
            {/* Header with Order Code, Status & Payment Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2D9C8] gap-3">
              <div>
                <span className="text-xs font-mono text-[#6B8077]">ORDER CODE:</span>
                <h2 className="font-display font-black text-2xl text-[#10231D]">
                  {booking.bookingCode}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Order Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wide border ${
                    booking.status === 'cancelled'
                      ? 'bg-[#F9ECE8] text-[#C2512D] border-[#C2512D]/30'
                      : booking.status === 'completed'
                      ? 'bg-[#DDEBE4] text-[#10231D] border-[#10231D]/20'
                      : booking.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-[#10231D] text-[#E9A23B] border-[#10231D]'
                  }`}
                >
                  STATUS: {booking.status?.replace('_', ' ')}
                </span>

                {/* Payment Status Badge */}
                {booking.paymentStatus === 'paid' ? (
                  <span className="px-3 py-1 rounded-full bg-[#10231D] text-[#25D366] font-mono text-xs font-bold uppercase border border-[#25D366]/40 flex items-center gap-1.5 shadow-xs">
                    <LuCheck className="w-3.5 h-3.5" />
                    <span>PAID ONLINE</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#F4EFE6] text-[#8C4F00] font-mono text-xs font-bold uppercase border border-[#E2D9C8] flex items-center gap-1.5 shadow-xs">
                    <LuBanknote className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>PAY ON SERVICE</span>
                  </span>
                )}
              </div>
            </div>

            {/* CUSTOMER SERVICE VERIFICATION OTP CARD (URBAN COMPANY / PRONTO SAFETY GATE) */}
            {booking.serviceOtp && (
              <div className="p-5 rounded-2xl bg-[#10231D] text-[#F4EFE6] border-2 border-[#E9A23B] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <LuShieldCheck className="w-4 h-4 text-[#E9A23B]" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E9A23B] font-bold">
                      VISIT START CODE (OTP)
                    </span>
                  </div>
                  <h4 className="font-display font-black text-lg text-[#F4EFE6]">
                    Share with Team Leader When They Arrive
                  </h4>
                  <p className="text-xs text-[#A3B8B0] max-w-md">
                    Share this 4-digit code with our team leader at your door to start your cleaning service.
                  </p>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="px-5 py-2.5 rounded-xl bg-white text-[#10231D] font-mono font-black text-2xl tracking-[0.3em] shadow-md border-2 border-[#E9A23B]">
                      {booking.serviceOtp}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyOtp(booking.serviceOtp)}
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#E9A23B] transition-colors cursor-pointer"
                      title="Copy OTP"
                    >
                      <LuCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {booking.otpVerified ? (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                        <LuCheck className="w-3 h-3" /> Verified on Visit
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#E9A23B] uppercase">
                        Pending Verification at Visit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ASSIGNED SUPERVISOR & TIME SLOT */}
            {Boolean(booking.assignedSupervisor?.name || booking.supervisor?.name) ? (() => {
              const sup = booking.assignedSupervisor?.name ? booking.assignedSupervisor : booking.supervisor;
              const avatarUrl = sup.avatarUrl || sup.avatar || sup.photo;
              return (
                <div className="p-4 rounded-2xl bg-white border border-[#E2D9C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <div className="relative shrink-0">
                        <img
                          src={avatarUrl}
                          alt={sup.name}
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-[#E9A23B] shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div
                          style={{ display: 'none' }}
                          className="w-13 h-13 rounded-2xl bg-[#10231D] text-[#E9A23B] items-center justify-center font-bold text-base shadow-sm border border-[#E2D9C8]"
                        >
                          {sup.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                          <LuCheck className="w-2.5 h-2.5 text-white" />
                        </span>
                      </div>
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center font-bold text-base shadow-xs shrink-0 border border-[#E2D9C8]">
                        <LuShieldCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-[#6B8077] font-bold">
                          ASSIGNED SUPERVISOR & LEAD
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1">
                          <LuCheck className="w-2.5 h-2.5" /> Dispatched
                        </span>
                      </div>
                      <p className="font-bold text-sm text-[#10231D]">{sup.name}</p>
                      <p className="text-[11px] text-[#6B8077]">
                        Scheduled Window: <span className="font-semibold text-[#10231D]">{formatDateDMY(booking.assignedSlot?.date || booking.slot?.date)} ({booking.assignedSlot?.timeWindow || booking.slot?.window})</span>
                      </p>
                      {(() => {
                        const cust = booking.address?.coordinates;
                        const supLoc = booking.supervisorLiveLocation;
                        if (!cust?.lat || !supLoc?.lat) return null;
                        const dist = calculateDistanceKm(cust.lat, cust.lng, supLoc.lat, supLoc.lng);
                        const eta = getEtaInfo(dist);
                        if (!eta) return null;
                        return (
                          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#10231D] text-[#F4EFE6] text-xs font-bold shadow-xs">
                            <span className={`w-2 h-2 rounded-full ${eta.isArrived ? 'bg-emerald-400' : 'bg-[#E9A23B] animate-ping'}`} />
                            <span className="text-[#E9A23B]">{eta.distanceText}</span>
                            <span className="text-stone-400">·</span>
                            <span className="text-emerald-300 font-mono">{eta.etaText}</span>
                            <span className="text-[10px] text-stone-300 font-normal">({eta.statusText})</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {sup.phone && (
                    <a
                      href={`tel:${sup.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-[#10231D] text-[#E9A23B] text-xs font-bold flex items-center gap-1.5 hover:bg-[#3D524A] transition-colors shadow-xs"
                    >
                      <LuPhone className="w-3.5 h-3.5" />
                      <span>Call Supervisor</span>
                    </a>
                  )}
                </div>
              );
            })() : (
              booking.status !== 'cancelled' && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#E2D9C8] flex items-center gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-[#ECE5D8] text-[#10231D] flex items-center justify-center shrink-0">
                    <LuClock className="w-4 h-4 text-[#E9A23B]" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#10231D]">Field Supervisor Allocation in Progress</p>
                    <p className="text-[#6B8077] text-[11px]">
                      Our operations dispatch team is currently allocating an area supervisor for your reserved slot ({formatDateDMY(booking.slot?.date)} • {booking.slot?.window}).
                    </p>
                  </div>
                </div>
              )
            )}

            {/* REAL-TIME SUPERVISOR LIVE TRACKING RADAR */}
            {booking.status !== 'cancelled' && (
              <LiveTrackingRadar
                bookingCode={booking.bookingCode}
                isSupervisorAssigned={Boolean(booking.supervisor || booking.assignedSupervisor?.name || booking.assignedSupervisor?.id)}
                initialSupervisorLocation={booking.supervisorLiveLocation}
                customerLocation={booking.address?.coordinates}
                destinationAddress={`${booking.address?.houseOrFlat ? booking.address.houseOrFlat + ', ' : ''}${booking.address?.line1 || ''}, ${booking.cityName || ''}`}
                supervisorInfo={booking.assignedSupervisor || (typeof booking.supervisor === 'object' ? booking.supervisor : null)}
              />
            )}

            {/* Cancelled Notice Banner */}
            {booking.status === 'cancelled' ? (
              <div className="p-4 rounded-2xl bg-[#F9ECE8] border border-[#C2512D]/30 text-[#C2512D] flex items-start gap-3">
                <LuCircleAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">This booking has been cancelled.</p>
                  <p className="text-xs text-[#8C3A20] mt-0.5">
                    {booking.paymentStatus === 'paid'
                      ? 'An advance digital payment was received. Your refund has been initiated to the original payment source and will reflect in 3–5 business days.'
                      : 'This reservation is cancelled and no crew will be dispatched. No payment was charged.'}
                  </p>
                </div>
              </div>
            ) : (
              /* Timeline Bar (Active orders only) */
              <div className="py-2">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#E2D9C8] -z-0" />
                  {steps.map((st, idx) => {
                    const isDone = idx <= currentStepIdx;
                    return (
                      <div key={st.key} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isDone
                              ? 'bg-[#E9A23B] text-[#10231D] ring-4 ring-[#ECE5D8]'
                              : 'bg-[#F4EFE6] text-[#6B8077] border border-[#E2D9C8]'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-center mt-2 max-w-[68px] sm:max-w-[80px] font-semibold text-[#10231D] leading-tight">
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Service & Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs">
              <div>
                <p className="text-[#6B8077] font-semibold">CUSTOMER:</p>
                <p className="font-bold text-[#10231D] text-sm">{booking.customer?.name}</p>
                <p className="text-[#3D524A]">{booking.customer?.phone}</p>
              </div>
              <div>
                <p className="text-[#6B8077] font-semibold">SCHEDULE:</p>
                <p className="font-bold text-[#10231D] text-sm">{formatDateDMY(booking.slot?.date)}</p>
                <p className="text-[#3D524A]">{booking.slot?.window}</p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#E2D9C8]">
                <p className="text-[#6B8077] font-semibold">SERVICE ADDRESS:</p>
                <p className="font-bold text-[#10231D]">{booking.address?.line1}, {booking.cityName} ({booking.address?.pincode})</p>
                {booking.address?.isTemporary && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[#F9ECE8] text-[#C2512D] font-bold">
                    Temporary Address
                  </span>
                )}
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="space-y-2 pt-2 border-t border-[#E2D9C8]">
              <p className="text-xs font-bold text-[#10231D]">RESERVED SERVICES:</p>
              {booking.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-[#E2D9C8]/60">
                  <div>
                    <span className="font-bold text-[#10231D]">{item.titleSnapshot}</span>
                    <span className="text-[#6B8077] ml-2">
                      ({item.variantSnapshot || 'Standard'} · Qty {item.qty})
                    </span>
                  </div>
                  <span className="font-bold text-[#10231D] tnum">
                    ₹{(item.priceSnapshot * item.qty).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {booking.totals?.platformChargeAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-[#3D524A] pt-1">
                  <span>{booking.totals.platformChargeLabel || 'Platform Charges'}</span>
                  <span className="font-bold text-[#10231D] tnum">
                    +₹{booking.totals.platformChargeAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {booking.totals?.gstAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-[#3D524A]">
                  <span>GST ({booking.totals.gstPercentage || 18}% on Overall Service)</span>
                  <span className="font-bold text-[#10231D] tnum">
                    +₹{booking.totals.gstAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Accurate Payment & Settlement Card */}
            <div className="pt-2">
              {booking.paymentStatus === 'paid' ? (
                <div className="p-4 rounded-2xl bg-[#DDEBE4]/60 border border-[#25D366]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#10231D] text-[#25D366] text-xs font-bold flex items-center gap-1">
                        <LuCheck className="w-3.5 h-3.5" /> Paid in Full Online
                      </span>
                      <span className="text-xs text-[#3D524A] font-medium">
                        via {booking.paymentDetails?.method ? booking.paymentDetails.method.toUpperCase() : 'Online Gateway'}
                      </span>
                    </div>
                    {booking.paymentDetails?.transactionId && (
                      <p className="text-[11px] font-mono text-[#3D524A] mt-1">
                        Ref: {booking.paymentDetails.transactionId}
                      </p>
                    )}
                    <p className="text-xs font-bold text-[#10231D] mt-1">
                      Remaining Balance Due: <span className="text-[#25D366]">₹0 (No Cash Required)</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#6B8077] block font-semibold">Total Paid</span>
                    <span className="font-display font-black text-2xl text-[#10231D] tnum">
                      ₹{booking.totals?.total?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-[#ECE5D8] text-[#8C4F00] text-xs font-bold flex items-center gap-1 w-fit">
                      <LuBanknote className="w-3.5 h-3.5 text-[#E9A23B]" /> Cash on Service
                    </span>
                    <p className="text-xs text-[#6B8077] mt-1">
                      Pay our crew directly via Cash or UPI QR upon service completion.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#6B8077] block font-semibold">Payable Upon Completion</span>
                    <span className="font-display font-black text-2xl text-[#10231D] tnum">
                      ₹{booking.totals?.total?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Savings Pill */}
              {booking.totals?.customerSaved > 0 && (
                <div className="mt-2 text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-black">
                    You saved ₹{booking.totals.customerSaved.toLocaleString('en-IN')} on this order!
                  </span>
                </div>
              )}
            </div>

            {/* INSPECTION PHOTOS GALLERY (BEFORE & AFTER PROOF) */}
            {((booking.photos?.before?.length || 0) > 0 || (booking.photos?.after?.length || 0) > 0) && (
              <div className="pt-4 border-t border-[#E2D9C8] space-y-4">
                <div className="flex items-center gap-2">
                  <LuCamera className="w-4 h-4 text-[#E9A23B]" />
                  <h4 className="font-display font-bold text-sm text-[#10231D]">
                    Supervisor Inspection Proof & Photos
                  </h4>
                </div>

                {/* Before Photos */}
                {booking.photos?.before?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B8077] font-bold block mb-1.5">
                      Pre-Service Inspection ({booking.photos.before.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {booking.photos.before.map((p, idx) => (
                        <a
                          key={idx}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-xl overflow-hidden border border-[#E2D9C8] bg-black block group"
                        >
                          <img
                            src={p.url}
                            alt={`Before inspection ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                            Before
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* After Photos */}
                {booking.photos?.after?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold block mb-1.5 flex items-center gap-1">
                      <LuSparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Post-Service Result Proof ({booking.photos.after.length})</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {booking.photos.after.map((p, idx) => (
                        <a
                          key={idx}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-xl overflow-hidden border border-emerald-300 bg-black block group"
                        >
                          <img
                            src={p.url}
                            alt={`After inspection ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-[9px] font-mono text-emerald-300">
                            After (Restored)
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Support Callout & Instagram */}
            <div className="pt-4 border-t border-[#E2D9C8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#3D524A]">
              <span>Need help or rescheduling?</span>
              <div className="flex items-center gap-4">
                <a
                  href={settings?.instagramUrl || "https://www.instagram.com/maxhousekeepingservice/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#833AB4] hover:text-[#FD1D1D] flex items-center gap-1 transition-colors"
                >
                  <FaInstagram className="w-3.5 h-3.5" /> @maxhousekeepingservice
                </a>
                <a
                  href={`tel:${(settings?.phone || '+919897766002').replace(/[^0-9+]/g, '')}`}
                  className="font-bold text-[#10231D] hover:underline flex items-center gap-1"
                >
                  <LuPhone className="w-3.5 h-3.5 text-[#E9A23B]" /> Call {settings?.phone || '+91 98977 66002'}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
