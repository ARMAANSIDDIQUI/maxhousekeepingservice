import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LuChevronUp,
  LuChevronDown,
  LuCalendar,
  LuClock,
  LuTag
} from 'react-icons/lu';
import { getServiceIcon } from '../../utils/iconHelper';

export default function VerticalHeroCarousel({ services = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = down (top to bottom), -1 = up

  const count = services ? services.length : 0;

  // Auto-cycle top-to-bottom every 4 seconds (called unconditionally)
  useEffect(() => {
    if (isPaused || count <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, count]);

  if (!services || services.length === 0) {
    return (
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden border-2 border-[#181511] shadow-2xl bg-[#181511] min-h-[460px] flex flex-col justify-between">
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#12100E]">
          <img
            src="/media/services/full-home-deep-cleaning.jpg"
            alt="Max Housekeeping Service - Professional Cleaning"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181511] via-[#181511]/30 to-transparent" />
          <div className="absolute bottom-3 right-4 w-10 h-10 rounded-xl bg-[#F4EFE6] text-[#181511] flex items-center justify-center shadow-lg border border-[#E2D9C8]">
            <LuClock className="w-5 h-5 text-[#E9A23B]" />
          </div>
        </div>
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between text-[#F4EFE6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#E9A23B] uppercase tracking-widest mb-1.5">
              <span>Western UP · Professional Cleaning</span>
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-[#F4EFE6] leading-snug">
              Professional Deep Cleaning
            </h3>
            <p className="text-xs text-[#DDEBE4]/80 mt-1.5 leading-relaxed">
              Industrial single-disc scrubbing, sofa extraction shampooing, and hospital-grade disinfection across Western UP.
            </p>
          </div>
          <div className="pt-4 mt-3 border-t border-[#E2D9C8]/15 flex items-center justify-between gap-4">
            <div>
              <span className="text-xl font-display font-black text-[#E9A23B]">Verified Crew</span>
              <span className="text-[10px] text-[#DDEBE4]/60 uppercase tracking-wider block">Eco-Safe Chemistry</span>
            </div>
            <Link
              to="/services"
              className="px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs tracking-wide transition-all shadow-md"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentService = services[currentIndex] || services[0];
  const prevIndex = (currentIndex - 1 + count) % count;
  const nextIndex = (currentIndex + 1) % count;
  const prevService = services[prevIndex];
  const nextService = services[nextIndex];

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % count);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  };

  // Uniform worker image fallbacks
  const defaultImages = [
    '/media/services/full-home-deep-cleaning.jpg',
    '/media/services/bathroom-tile-cleaning.jpg',
    '/media/services/kitchen-deep-cleaning.jpg',
    '/media/services/sofa-dry-cleaning.jpg'
  ];

  const getHeroImg = (svc, idx) => {
    if (svc.media?.hero?.url) return svc.media.hero.url;
    return defaultImages[idx % defaultImages.length];
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Floating Mini Card (Next in queue / coming from top) */}
      {count > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          className="w-[88%] mb-2 p-2.5 rounded-2xl bg-[#ECE5D8]/80 hover:bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-between text-left opacity-75 hover:opacity-100 transition-all scale-95 shadow-sm group cursor-pointer"
          title="Click to view previous service"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="p-1 rounded-lg bg-[#F4EFE6] text-[#E9A23B] shrink-0">
              {getServiceIcon(prevService.icon, 'w-3.5 h-3.5')}
            </span>
            <div className="truncate">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6B8077] block leading-none">
                Previous
              </span>
              <p className="text-xs font-bold text-[#10231D] truncate mt-0.5">
                {prevService.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span className="text-xs font-bold text-[#10231D] tnum">
              ₹{prevService.price?.toLocaleString('en-IN')}
            </span>
            <LuChevronUp className="w-4 h-4 text-[#6B8077] group-hover:text-[#E9A23B] transition-colors" />
          </div>
        </button>
      )}

      {/* Center Main Active Card (Current Service) */}
      <div className="relative w-full rounded-3xl overflow-hidden border-2 border-[#181511] shadow-2xl bg-[#181511] min-h-[460px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentService._id || currentService.slug}
            initial={{ opacity: 0, y: direction > 0 ? -24 : 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction > 0 ? 24 : -24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            {/* Service Hero Image */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#12100E]">
              <img
                src={getHeroImg(currentService, currentIndex)}
                alt={currentService.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.src = '/media/services/full-home-deep-cleaning.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181511] via-[#181511]/30 to-transparent" />

              {/* Discount Chip */}
              {currentService.mrp > currentService.price && (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-[#C2512D] text-[#F4EFE6] font-bold text-xs shadow-md flex items-center gap-1">
                  <LuTag className="w-3 h-3" />
                  <span>
                    {Math.round(((currentService.mrp - currentService.price) / currentService.mrp) * 100)}% OFF
                  </span>
                </div>
              )}

              {/* Service Icon floating badge */}
              <div className="absolute bottom-3 right-4 w-10 h-10 rounded-xl bg-[#F4EFE6] text-[#181511] flex items-center justify-center shadow-lg border border-[#E2D9C8]">
                {getServiceIcon(currentService.icon, 'w-5 h-5 text-[#E9A23B]')}
              </div>
            </div>

            {/* Service Details & Dual-Pricing Meta */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-[#181511] text-[#F4EFE6]">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#E9A23B] uppercase tracking-widest mb-1.5">
                  <span>{currentService.categoryName || 'Professional Cleaning'}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <LuClock className="w-3 h-3" />
                    <span>{currentService.duration || '2-3 hrs'}</span>
                  </span>
                </div>

                <h3 className="font-display font-black text-xl sm:text-2xl text-[#F4EFE6] leading-snug">
                  {currentService.title}
                </h3>

                <p className="text-xs text-[#DDEBE4]/80 mt-1.5 line-clamp-2 leading-relaxed">
                  {currentService.shortDescription || currentService.description}
                </p>
              </div>

              {/* Dual Price Bar & Direct Booking Actions */}
              <div className="pt-4 mt-3 border-t border-[#E2D9C8]/15 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-black text-[#E9A23B] tnum">
                      ₹{currentService.price?.toLocaleString('en-IN')}
                    </span>
                    {currentService.mrp > currentService.price && (
                      <span className="text-xs text-[#6B8077] line-through tnum">
                        ₹{currentService.mrp?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#DDEBE4]/60 uppercase tracking-wider block">
                    Offered Rate · All Inclusive
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/services/${currentService.slug}`}
                    className="px-3 py-2 rounded-xl bg-[#ECE5D8]/10 hover:bg-[#ECE5D8]/20 text-[#F4EFE6] font-bold text-xs transition-colors"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/book/${currentService.slug}`}
                    className="px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs tracking-wide transition-all shadow-md flex items-center gap-1.5"
                  >
                    <LuCalendar className="w-3.5 h-3.5" />
                    <span>Book Now</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Vertical Stepper Controls inside Card */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 rounded-full bg-[#181511]/80 hover:bg-[#181511] text-[#F4EFE6] flex items-center justify-center transition-colors border border-white/20 shadow-md"
            aria-label="Previous Service"
          >
            <LuChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-7 h-7 rounded-full bg-[#181511]/80 hover:bg-[#181511] text-[#F4EFE6] flex items-center justify-center transition-colors border border-white/20 shadow-md"
            aria-label="Next Service"
          >
            <LuChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Mini Card (Next in line / moving towards bottom) */}
      {count > 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="w-[88%] mt-2 p-2.5 rounded-2xl bg-[#ECE5D8]/80 hover:bg-[#ECE5D8] border border-[#E2D9C8] flex items-center justify-between text-left opacity-75 hover:opacity-100 transition-all scale-95 shadow-sm group cursor-pointer"
          title="Click to view next service"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="p-1 rounded-lg bg-[#F4EFE6] text-[#E9A23B] shrink-0">
              {getServiceIcon(nextService.icon, 'w-3.5 h-3.5')}
            </span>
            <div className="truncate">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6B8077] block leading-none">
                Next
              </span>
              <p className="text-xs font-bold text-[#10231D] truncate mt-0.5">
                {nextService.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span className="text-xs font-bold text-[#10231D] tnum">
              ₹{nextService.price?.toLocaleString('en-IN')}
            </span>
            <LuChevronDown className="w-4 h-4 text-[#6B8077] group-hover:text-[#E9A23B] transition-colors" />
          </div>
        </button>
      )}

      {/* Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {services.map((svc, idx) => (
          <button
            key={svc._id || svc.slug}
            type="button"
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`transition-all ${
              idx === currentIndex
                ? 'w-6 h-1.5 rounded-full bg-[#E9A23B]'
                : 'w-1.5 h-1.5 rounded-full bg-[#6B8077]/40 hover:bg-[#6B8077]'
            }`}
            aria-label={`Jump to ${svc.title}`}
          />
        ))}
      </div>
    </div>
  );
}
