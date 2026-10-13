import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LuSearch, LuCalendar, LuMapPin, LuClock, LuPhone, LuShieldCheck } from 'react-icons/lu';
import { apiRequest } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function TrackBookingPage() {
  const { code } = useParams();
  const [searchCode, setSearchCode] = useState(code || '');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const steps = [
    { key: 'pending', label: 'Reservation Received' },
    { key: 'confirmed', label: 'Confirmed & Crew Assigned' },
    { key: 'in_progress', label: 'Service In-Progress' },
    { key: 'completed', label: 'Completed & Inspected' }
  ];

  const currentStepIdx = booking ? steps.findIndex(s => s.key === booking.status) : -1;

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
            LIVE DISPATCH STATUS
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
            className="px-6 py-3.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-sm shadow-md"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Booking Details Card */}
        {booking && (
          <div className="bg-[#ECE5D8] p-6 sm:p-8 rounded-3xl border-2 border-[#10231D] shadow-xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2D9C8] gap-2">
              <div>
                <span className="text-xs font-mono text-[#6B8077]">ORDER CODE:</span>
                <h2 className="font-display font-black text-2xl text-[#10231D]">
                  {booking.bookingCode}
                </h2>
              </div>
              <span className="self-start px-3 py-1 rounded-full bg-[#10231D] text-[#E9A23B] font-mono text-xs font-bold uppercase">
                STATUS: {booking.status}
              </span>
            </div>

            {/* Timeline Bar */}
            <div className="py-4">
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
                      <span className="text-[10px] text-center mt-2 max-w-[80px] font-semibold text-[#10231D]">
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service & Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-xs">
              <div>
                <p className="text-[#6B8077] font-semibold">CUSTOMER:</p>
                <p className="font-bold text-[#10231D] text-sm">{booking.customer.name}</p>
                <p className="text-[#3D524A]">{booking.customer.phone}</p>
              </div>
              <div>
                <p className="text-[#6B8077] font-semibold">SCHEDULE:</p>
                <p className="font-bold text-[#10231D] text-sm">{booking.slot.date}</p>
                <p className="text-[#3D524A]">{booking.slot.window}</p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#E2D9C8]">
                <p className="text-[#6B8077] font-semibold">SERVICE ADDRESS:</p>
                <p className="font-bold text-[#10231D]">{booking.address.line1}, {booking.cityName} ({booking.address.pincode})</p>
                {booking.address.isTemporary && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[#F9ECE8] text-[#C2512D] font-bold">
                    Temporary Address
                  </span>
                )}
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="space-y-2 pt-2 border-t border-[#E2D9C8]">
              <p className="text-xs font-bold text-[#10231D]">RESERVED SERVICES:</p>
              {booking.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-1.5 border-b border-[#E2D9C8]/60">
                  <div>
                    <span className="font-bold text-[#10231D]">{item.titleSnapshot}</span>
                    <span className="text-[#6B8077] ml-2">({item.variantSnapshot || 'Standard'} · Qty {item.qty})</span>
                  </div>
                  <span className="font-bold text-[#10231D] tnum">₹{item.priceSnapshot * item.qty}</span>
                </div>
              ))}
            </div>

            {/* Total and Savings */}
            <div className="pt-2 flex items-baseline justify-between">
              <div>
                <p className="text-xs text-[#6B8077]">Payable upon completion:</p>
                <p className="font-display font-black text-2xl text-[#10231D] tnum">
                  ₹{booking.totals.total.toLocaleString('en-IN')}
                </p>
              </div>
              {booking.totals.customerSaved > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-black">
                  You saved ₹{booking.totals.customerSaved.toLocaleString('en-IN')}!
                </span>
              )}
            </div>

            {/* Support Callout */}
            <div className="pt-4 border-t border-[#E2D9C8] flex items-center justify-between text-xs text-[#3D524A]">
              <span>Need help or rescheduling?</span>
              <a href="tel:9897766002" className="font-bold text-[#10231D] hover:underline flex items-center gap-1">
                <LuPhone className="w-3.5 h-3.5 text-[#E9A23B]" /> Call 98977 66002
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
