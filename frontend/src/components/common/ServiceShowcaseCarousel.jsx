import React, { useState, useEffect } from 'react';
import { LuChevronLeft, LuChevronRight, LuSparkles } from 'react-icons/lu';

const SHOWCASE_SLIDES = [
  {
    src: '/file_0000000065a882118645887aa8414c01.png',
    title: 'Shop & Showroom Cleaning',
    subtitle: 'Spotless glass displays, fixtures, and retail floors for commercial spaces'
  },
  {
    src: '/file_00000000d6d081faa737557107d27d43.png',
    title: 'Office & Corporate Deep Cleaning',
    subtitle: 'Mechanized floor scrubbing, workstation sanitization, and trained uniformed crew'
  },
  {
    src: '/file_00000000ede881fa8e9c94ebccf3fd96.png',
    title: 'Commercial Spaces & Hygiene Care',
    subtitle: 'Eco-friendly chemicals, professional equipment, and on-time service delivery'
  }
];

export default function ServiceShowcaseCarousel({ className = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  };

  const currentSlide = SHOWCASE_SLIDES[activeIndex];

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="text-center max-w-xl mx-auto mb-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
          <LuSparkles className="w-3.5 h-3.5" />
          SERVICE SHOWCASE
        </span>
        <h3 className="font-display font-bold text-2xl text-[#10231D] mt-1">
          Our Cleaning Standards in Action
        </h3>
        <p className="text-xs text-[#6B8077] mt-1">
          Explore our uniformed team, mechanized tools, and commercial &amp; residential cleaning setups.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#10231D] bg-[#10231D] shadow-lg aspect-[4/3] sm:aspect-[16/10]">
          <img
            src={currentSlide.src}
            alt={currentSlide.title}
            className="w-full h-full object-contain bg-[#10231D] transition-opacity duration-300"
          />

          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#10231D]/80 hover:bg-[#E9A23B] text-[#F4EFE6] hover:text-[#10231D] border border-[#E9A23B]/40 flex items-center justify-center transition shadow-md"
          >
            <LuChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#10231D]/80 hover:bg-[#E9A23B] text-[#F4EFE6] hover:text-[#10231D] border border-[#E9A23B]/40 flex items-center justify-center transition shadow-md"
          >
            <LuChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <div>
            <h4 className="font-display font-bold text-base text-[#10231D]">
              {currentSlide.title}
            </h4>
            <p className="text-xs text-[#5A6E66]">
              {currentSlide.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {SHOWCASE_SLIDES.map((slide, idx) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                className={`h-2.5 rounded-full transition-all ${
                  idx === activeIndex
                    ? 'w-7 bg-[#10231D]'
                    : 'w-2.5 bg-[#10231D]/25 hover:bg-[#10231D]/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
