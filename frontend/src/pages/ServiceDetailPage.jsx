import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LuCheck,
  LuX,
  LuClock,
  LuShieldCheck,
  LuCalendar,
  LuArrowLeft,
  LuSparkles
} from 'react-icons/lu';
import { apiRequest } from '../api';
import { useBooking } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';
import { getServiceIcon } from '../utils/iconHelper';

// Helper to compute exact variant pricing for any service and variant key
function getVariantPricingInfo(service, optKey, groupKey) {
  if (!service) return { price: 0, mrp: 0, duration: '1 hr' };

  // 1. Matrix row match
  if (service.matrix && Array.isArray(service.matrix) && service.matrix.length > 0) {
    for (const row of service.matrix) {
      if (row.isActive === false) continue;
      const sel = row.selection instanceof Map ? Object.fromEntries(row.selection) : (row.selection || {});
      const rowVal = String(sel[groupKey] || Object.values(sel)[0] || '').toLowerCase().trim();
      if (rowVal === String(optKey).toLowerCase().trim()) {
        return {
          price: row.price,
          mrp: row.mrp || row.price,
          duration: row.duration || service.duration || '1 hr'
        };
      }
    }
  }

  // 2. Option group delta / multiplier match
  const basePrice = service.price || 0;
  const baseMrp = service.mrp || service.price || 0;
  const group = service.optionGroups?.find(g => g.key === groupKey) || service.optionGroups?.[0];
  const opt = group?.options?.find(o => o.key === optKey);
  if (opt) {
    let p = basePrice + (opt.priceDelta || 0);
    let m = baseMrp + (opt.mrpDelta || opt.priceDelta || 0);
    if (opt.multiplier && opt.multiplier > 0) {
      p = Math.round(p * opt.multiplier);
      m = Math.round(m * opt.multiplier);
    }
    return {
      price: p,
      mrp: m,
      duration: opt.durationDelta || service.duration || '1 hr'
    };
  }

  return { price: basePrice, mrp: baseMrp, duration: service.duration || '1 hr' };
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50); // Before/After slider

  const { addItem } = useBooking();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadService() {
      setLoading(true);
      try {
        const res = await apiRequest(`/services/${slug}`);
        if (res && res.success && res.service) {
          setService(res.service);
          const primaryGroup = res.service.optionGroups?.[0];
          const defaultOpt = primaryGroup?.options?.find(o => o.isDefault) || primaryGroup?.options?.[0];
          const defaultKey = defaultOpt?.key || (res.service.matrix?.[0] ? Object.values(res.service.matrix[0].selection || {})[0] : '');
          setSelectedVariant(defaultKey || '');
        } else {
          setService(null);
        }
      } catch (err) {
        console.warn('Network service fetch failed:', slug);
        setService(null);
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-[#6B8077] bg-[#F4EFE6] min-h-screen">
        LOADING PACKAGE DETAILS...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-24 text-center bg-[#F4EFE6] min-h-screen">
        <h2 className="font-display font-bold text-2xl text-[#10231D]">Service Not Found</h2>
        <Link to="/services" className="mt-4 inline-block text-sm font-bold text-[#E9A23B]">
          Return to All Services
        </Link>
      </div>
    );
  }

  // Calculate pricing based on selected variant
  const optionGroup = service.optionGroups?.[0];
  const activeVariantKey = selectedVariant || optionGroup?.options?.[0]?.key || '';
  const currentPricing = getVariantPricingInfo(service, activeVariantKey, optionGroup?.key || 'size');

  const currentPrice = currentPricing.price;
  const currentMrp = currentPricing.mrp;
  const currentDuration = currentPricing.duration;
  const savings = Math.max(0, currentMrp - currentPrice);
  const discountPct = currentMrp > 0 ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const handleBookNow = () => {
    const selections = optionGroup ? { [optionGroup.key]: activeVariantKey } : {};
    addItem(service, selections, 1);
    navigate('/book');
  };

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb Back */}
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10231D] hover:text-[#E9A23B] mb-6 transition-colors"
        >
          <LuArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </Link>

        {/* Top Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-14">
          {/* Service Image / Worker Action */}
          <div className="lg:col-span-6 rounded-2xl overflow-hidden border-2 border-[#10231D] shadow-xl bg-[#ECE5D8]">
            <img
              src={service.media?.hero?.url || `/media/categories/${service.categorySlug || 'home-deep-cleaning'}.jpg`}
              alt={service.title}
              className="w-full h-80 sm:h-96 object-cover"
              onError={(e) => { e.currentTarget.src = '/media/site/hero-clean-home.jpg'; }}
            />
          </div>

          {/* Details & Live Pricing Calculator */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
                {service.categoryName}
              </span>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-[#10231D] leading-tight mt-1 flex items-center gap-3">
                <span className="p-2 sm:p-2.5 rounded-2xl bg-[#ECE5D8] text-[#E9A23B] shrink-0 inline-flex shadow-xs border border-[#E2D9C8]">
                  {getServiceIcon(service.icon, 'w-6 h-6 sm:w-8 sm:h-8')}
                </span>
                <span>{service.title}</span>
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#6B8077]">
                <span className="flex items-center gap-1">
                  <LuClock className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>Duration: {currentDuration}</span>
                </span>
                <span>·</span>
                <span className="text-[#10231D] font-semibold">Background Verified</span>
              </div>
            </div>

            <p className="text-sm text-[#3D524A] leading-relaxed">
              {service.description}
            </p>

            {/* Interactive Variant Selection */}
            {optionGroup && optionGroup.options?.length > 0 && (
              <div className="p-4 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <label className="block text-xs font-bold text-[#10231D] mb-2">
                  Select {optionGroup.label}:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {optionGroup.options.map((opt) => {
                    const optPrice = getVariantPricingInfo(service, opt.key, optionGroup.key);
                    const isSelected = activeVariantKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedVariant(opt.key)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#10231D] text-[#F4EFE6] shadow-md ring-2 ring-[#E9A23B]'
                            : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8] border border-[#E2D9C8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className={`text-[11px] font-mono font-semibold ${isSelected ? 'text-[#E9A23B]' : 'text-[#6B8077]'}`}>
                          · ₹{optPrice.price.toLocaleString('en-IN')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Dual Pricing Readout */}
            <div className="p-5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
              <div className="flex items-baseline gap-3">
                <span className="font-display font-black text-3xl text-[#10231D] tnum">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {currentMrp > currentPrice && (
                  <span className="text-lg text-[#6B8077] line-through tnum">
                    ₹{currentMrp.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-black">
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              {savings > 0 && (
                <p className="text-xs font-bold text-[#C2512D] mt-1.5">
                  You save ₹{savings.toLocaleString('en-IN')} with our direct booking rate!
                </p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleBookNow}
                  className="flex-1 py-3.5 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-black text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <LuCalendar className="w-4 h-4" />
                  <span>Book This Package Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          {/* Inclusions */}
          <div className="p-6 rounded-2xl bg-[#ECE5D8]/70 border border-[#E2D9C8]">
            <h3 className="font-display font-bold text-lg text-[#10231D] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#DDEBE4] text-[#10231D] text-xs font-bold flex items-center justify-center">
                ✓
              </span>
              <span>What Is Included</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-[#3D524A]">
              {service.inclusions && service.inclusions.length > 0 ? (
                service.inclusions.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <LuCheck className="w-4 h-4 text-[#10231D] shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#6B8077] italic">Full surface sanitisation, deep grime removal, and professional equipment detailing included.</li>
              )}
            </ul>
          </div>

          {/* Exclusions */}
          <div className="p-6 rounded-2xl bg-[#ECE5D8]/70 border border-[#E2D9C8]">
            <h3 className="font-display font-bold text-lg text-[#10231D] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-bold flex items-center justify-center">
                ✕
              </span>
              <span>What Is Excluded</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-[#3D524A]">
              {service.exclusions && service.exclusions.length > 0 ? (
                service.exclusions.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <LuX className="w-4 h-4 text-[#C2512D] shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#6B8077] italic">No major exclusions noted. Standard household safety guidelines apply.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Interactive Before & After Demonstration Slider */}
        <div className="p-8 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] mb-14">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
              RESULTS YOU CAN SEE
            </span>
            <h3 className="font-display font-bold text-2xl text-[#10231D] mt-1">
              Before & After Demonstration
            </h3>
            <p className="text-xs text-[#6B8077] mt-1">
              Drag the brass slider horizontally to compare surface restoration.
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative w-full max-w-2xl mx-auto h-72 sm:h-96 rounded-2xl overflow-hidden select-none border-2 border-[#10231D]">
            {/* After Image (Full width background) */}
            <img
              src="/media/services/full-home-deep-cleaning.jpg"
              alt="Clean restored surface"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute bottom-4 right-4 px-2.5 py-1 rounded bg-[#10231D]/80 text-[#F4EFE6] text-[11px] font-bold">
              AFTER (Restored)
            </span>

            {/* Before Image (Clipped overlay) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src="/media/services/kitchen-deep-cleaning.jpg"
                alt="Uncleaned surface before service"
                className="absolute inset-0 w-[672px] h-full object-cover filter saturate-50 contrast-125"
                style={{ maxWidth: 'none' }}
              />
              <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded bg-[#10231D]/80 text-[#F4EFE6] text-[11px] font-bold">
                BEFORE (Dust & Grime)
              </span>
            </div>

            {/* Drag Handle Divider */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#E9A23B] cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-[#E9A23B] text-[#10231D] flex items-center justify-center font-bold text-xs shadow-lg">
                ↔
              </div>
            </div>

            {/* Invisible Range Input for accessibility and dragging */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
              aria-label="Before after comparison slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
