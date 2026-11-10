import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LuSparkles,
  LuShieldCheck,
  LuStar,
  LuArrowRight,
  LuCalendar,
  LuPhoneCall,
  LuChevronDown,
  LuShoppingBag,
  LuCheck
} from 'react-icons/lu';
import { useBooking } from '../../context/BookingContext';
import { getServiceIcon } from '../../utils/iconHelper';

export default function UniqueHeroSection({ services = [] }) {
  const navigate = useNavigate();
  const { addItem, selectedCity, settings } = useBooking();
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [addedAnim, setAddedAnim] = useState(false);

  const cityName = selectedCity?.name || 'Moradabad';

  // Responsive screen-size tracking:
  // - Desktop (>= 768px): Only 1 video (home_hero.mp4 by default)
  // - Mobile (< 768px): Only 1 video (homehero4.mp4 by default)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const heroVideos = useMemo(() => {
    if (!isMobile) {
      // Big screen (Desktop/Tablet >= 768px): Strictly 1 video (default /media/site/home_hero.mp4)
      const desktopSrc = (settings?.heroVideoUrl && String(settings.heroVideoUrl).trim()) || '/media/site/home_hero.mp4';
      return [
        { id: 'hero-desktop', src: desktopSrc, title: 'Spotless Homes. Zero Stress.' }
      ];
    } else {
      // Mobile screen (< 768px): Strictly 1 video (default /media/site/homehero4.mp4)
      const customMob = Array.isArray(settings?.mobileHeroVideos)
        ? settings.mobileHeroVideos
            .map(v => String(v || '').trim())
            .filter(v => Boolean(v) && !v.includes('homehero2'))
        : [];
      const mobileSrc = customMob[0] || '/media/site/homehero4.mp4';

      return [
        { id: 'hero-mobile', src: mobileSrc, title: 'Whole Home Deep Cleaning' }
      ];
    }
  }, [isMobile, settings]);

  const [[activeVideoIndex, direction], setVideoPage] = useState([0, 0]);
  const activeVideo = heroVideos[activeVideoIndex] || heroVideos[0];
  const videoRef = useRef(null);

  // Reset active video index when switching between mobile and desktop
  useEffect(() => {
    setVideoPage([0, 0]);
  }, [isMobile, heroVideos.length]);

  // Auto-play video immediately when active index or video source changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [activeVideoIndex, activeVideo?.src]);

  const handleNextVideo = () => {
    setVideoPage(([prev]) => [(prev + 1) % heroVideos.length, 1]);
  };

  const handlePrevVideo = () => {
    setVideoPage(([prev]) => [(prev - 1 + heroVideos.length) % heroVideos.length, -1]);
  };

  const handleSelectVideo = (idx) => {
    setVideoPage(([prev]) => [idx, idx > prev ? 1 : -1]);
  };

  // Dynamic Transition Variants controlled by Admin Settings
  const transitionMode = settings?.heroVideoTransition || 'swipe';
  const videoSwipeVariants = useMemo(() => {
    if (transitionMode === 'zoom') {
      return {
        enter: { opacity: 0, scale: 0.84, borderRadius: '48px' },
        center: {
          opacity: 1,
          scale: 1,
          borderRadius: '0px',
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
        },
        exit: { opacity: 0, scale: 1.08, transition: { duration: 0.4 } }
      };
    }
    if (transitionMode === 'fade') {
      return {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: { duration: 0.6 } },
        exit: { opacity: 0, transition: { duration: 0.4 } }
      };
    }
    // Default: Directional Swipe
    return {
      enter: (dir) => ({
        x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
        opacity: 0,
        scale: 0.94
      }),
      center: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
          x: { type: 'spring', stiffness: 260, damping: 28 },
          opacity: { duration: 0.4 },
          scale: { duration: 0.4 }
        }
      },
      exit: (dir) => ({
        x: dir < 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.94,
        transition: {
          x: { type: 'spring', stiffness: 260, damping: 28 },
          opacity: { duration: 0.3 }
        }
      })
    };
  }, [transitionMode]);

  // Compute dynamic height style & video fit class from Admin Settings
  // Max height strictly capped at screen size (100dvh / 100vh)
  const mobileHeightVh = Math.max(40, Math.min(100, Number(settings?.mobileHeroHeightVh ?? 92)));
  const desktopMode = settings?.desktopHeroHeightMode || 'fullscreen';
  const desktopHeightClass =
    desktopMode === 'tall'
      ? 'md:h-screen md:max-h-screen md:min-h-0'
      : desktopMode === 'compact'
      ? 'md:h-[78vh] md:max-h-screen md:min-h-0'
      : 'md:h-[calc(100vh-68px)] md:max-h-[calc(100vh-68px)] md:min-h-0';
  const videoFitClass = settings?.heroVideoFitMode === 'cover' ? 'object-cover' : 'object-contain';

  // Dynamically resolve curated services directly from live MongoDB database props
  const dynamicHeroServices = useMemo(() => {
    if (!services || services.length === 0) {
      return [
        { id: 'sofa-dry-cleaning', title: 'Sofa Cleaning', subtitle: 'Deep Extraction & Stain Removal', price: 750, slug: 'sofa-dry-cleaning', realisticIconKey: 'sofa' },
        { id: 'bathroom-deep-cleaning', title: 'Bathroom Deep Clean', subtitle: 'Hard Water Tiles & Descaling', price: 499, slug: 'bathroom-deep-cleaning', realisticIconKey: 'bathroom' },
        { id: 'kitchen-deep-cleaning', title: 'Kitchen Deep Clean', subtitle: 'Heavy Degreasing & Buffing', price: 1000, slug: 'kitchen-deep-cleaning', realisticIconKey: 'stove' },
        { id: 'chimney-cleaning', title: 'Chimney Cleaning', subtitle: 'Filter Degreasing & Carbon Removal', price: 500, slug: 'chimney-cleaning', realisticIconKey: 'chimney' },
        { id: 'bed-dry-cleaning', title: 'Bed & Mattress', subtitle: 'Deep Wand Extraction & Sanitizing', price: 500, slug: 'bed-dry-cleaning', realisticIconKey: 'bed' },
        { id: 'full-home-deep-cleaning', title: 'Full Home Clean', subtitle: 'Complete Doorstep Restoration', price: 4999, slug: 'full-home-deep-cleaning', realisticIconKey: 'fullhome' },
        { id: 'water-tank-cleaning', title: 'Water Tank Cleaning', subtitle: 'Sediment & Sludge Removal', price: 400, slug: 'water-tank-cleaning', realisticIconKey: 'watertank' },
        { id: 'carpet-cleaning', title: 'Carpet & Rugs', subtitle: 'Deep Foam Shampooing', price: 30, slug: 'carpet-cleaning', realisticIconKey: 'carpet' }
      ];
    }

    // Priority targets to build a curated, high-demand 8-tile dock
    const priorityTargets = [
      { key: 'sofa', slugs: ['sofa-dry-cleaning', 'sofa-cleaning'], fallbackIcon: 'sofa' },
      { key: 'bathroom', slugs: ['bathroom-deep-cleaning', 'tile-wala-bathroom-cleaning', 'large-size-tiles-bathroom-cleaning'], fallbackIcon: 'bathroom' },
      { key: 'kitchen', slugs: ['kitchen-deep-cleaning', 'small-kitchen-cleaning', 'big-kitchen-deep-cleaning'], fallbackIcon: 'stove' },
      { key: 'chimney', slugs: ['chimney-cleaning'], fallbackIcon: 'chimney' },
      { key: 'bed', slugs: ['bed-dry-cleaning', 'double-bed-mattress-up-drycleaning', 'bedhead-drycleaning-services'], fallbackIcon: 'bed' },
      { key: 'fullhome', slugs: ['full-home-deep-cleaning'], fallbackIcon: 'fullhome' },
      { key: 'watertank', slugs: ['water-tank-cleaning'], fallbackIcon: 'watertank' },
      { key: 'carpet', slugs: ['carpet-cleaning'], fallbackIcon: 'carpet' }
    ];

    const mapped = [];
    const usedSlugs = new Set();

    for (const p of priorityTargets) {
      const match = services.find(s => p.slugs.includes(s.slug));
      if (match) {
        mapped.push({
          id: match.slug,
          rawService: match,
          title: match.title,
          subtitle: match.shortDescription || match.categoryName || 'Doorstep Deep Clean',
          price: match.price,
          slug: match.slug,
          realisticIconKey: match.realisticIcon || p.fallbackIcon
        });
        usedSlugs.add(match.slug);
      }
    }

    // Fill remaining slots up to 8 if any are missing
    if (mapped.length < 8) {
      for (const s of services) {
        if (!usedSlugs.has(s.slug) && mapped.length < 8) {
          mapped.push({
            id: s.slug,
            rawService: s,
            title: s.title,
            subtitle: s.shortDescription || s.categoryName || 'Specialist Cleaning',
            price: s.price,
            slug: s.slug,
            realisticIconKey: s.realisticIcon || s.slug || s.icon
          });
          usedSlugs.add(s.slug);
        }
      }
    }

    return mapped;
  }, [services]);

  // Set default selected service if not yet chosen or not matching
  const selectedService = useMemo(() => {
    if (!dynamicHeroServices || dynamicHeroServices.length === 0) return null;
    if (!selectedServiceId) return dynamicHeroServices[0];
    return dynamicHeroServices.find(s => s.id === selectedServiceId) || dynamicHeroServices[0];
  }, [dynamicHeroServices, selectedServiceId]);

  const matchedDbService = useMemo(() => {
    if (!selectedService) return null;
    if (selectedService.rawService) return selectedService.rawService;
    return services?.find(s => s.slug === selectedService.slug) || null;
  }, [selectedService, services]);

  const handleAddToCart = (item) => {
    const target = item || selectedService;
    const dbMatch = target?.rawService || services?.find(s => s.slug === target?.slug);
    if (dbMatch) {
      try {
        addItem(dbMatch);
        setAddedAnim(true);
        setTimeout(() => setAddedAnim(false), 2200);
      } catch (e) {
        console.warn('Failed to add item to cart:', e);
      }
    } else if (target?.slug) {
      navigate(`/book/${target.slug}`);
    }
  };

  const scrollToServices = () => {
    const el = document.getElementById('quick-service-selector');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-[#F4EFE6]">
      
      {/* ========================================================
          1. CINEMATIC HERO SECTION
          - Dynamic Fullscreen Matching: 100vw x 100vh / 100dvh on mobile & desktop
          - Edge-to-edge full width and full viewport height
          - Complete unclipped video visibility with neutral grey framing
      ======================================================== */}
      <div className="w-full p-0 m-0 bg-[#F4EFE6]">
        
        <section
          style={
            isMobile
              ? { height: `${mobileHeightVh}dvh`, maxHeight: '100dvh' }
              : { maxHeight: '100vh' }
          }
          className={`relative w-full overflow-hidden bg-[#F4EFE6] h-[92dvh] max-h-[100dvh] ${desktopHeightClass} flex flex-col justify-end p-4 sm:p-6 md:p-10 lg:p-14 shadow-none`}
        >
          
          {/* Dynamic Video Stage: 100% VISIBLE WITH THEME-MATCHED CREAM FRAMING */}
          <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-[#F4EFE6] flex items-center justify-center">
            
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={activeVideo.src + '-' + activeVideoIndex}
                custom={direction}
                variants={videoSwipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag={heroVideos.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;
                  if (swipe < -80 || offset.x < -60) {
                    handleNextVideo();
                  } else if (swipe > 80 || offset.x > 60) {
                    handlePrevVideo();
                  }
                }}
                className="absolute inset-0 w-full h-full flex items-center justify-center touch-pan-y bg-[#F4EFE6]"
              >
                {/* 1. Ambient Blurred Fill (Soft atmospheric glow behind the unclipped video frame) */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-25 blur-2xl scale-110">
                  <video
                    src={activeVideo.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* 2. Theme-Matched Cream / Sand Background Frame (#F4EFE6 / #ECE5D8) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#F4EFE6]/95 via-[#ECE5D8]/85 to-[#F4EFE6]/95 pointer-events-none" />

                {/* 3. The Video Itself: 100% UNCLIPPED & FULLY VISIBLE REGARDLESS OF SCREEN/ASPECT RATIO */}
                <video
                  key={activeVideo.src}
                  ref={videoRef}
                  src={activeVideo.src}
                  autoPlay
                  loop={heroVideos.length === 1}
                  muted
                  playsInline
                  onEnded={heroVideos.length > 1 ? handleNextVideo : undefined}
                  className={`w-full h-full max-w-full max-h-full ${videoFitClass} object-center relative z-10 filter brightness-[1.02] contrast-[1.02]`}
                  poster="/media/site/hero-clean-home.jpg"
                />
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Ultra-Compact Bottom-Aligned Content (Bright, Crisp & Zero Muddy Dark Shadow Over Video) */}
          <div className="container mx-auto px-0 md:px-4 relative z-30 mt-auto pb-1 sm:pb-2">
            <div className="max-w-2xl bg-[#F4EFE6]/92 backdrop-blur-md border border-[#E2D9C8] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
              
              {/* Sleek Compact Headline (Crisp Dark Forest Ink & Brass Gold) */}
              <h1 className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-[#10231D] leading-snug mb-1">
                Spotless homes. <span className="text-[#D48E28]">Zero stress.</span>
              </h1>

              {/* Crisp Attention-Grabbing Line */}
              <p className="text-[11px] sm:text-xs md:text-sm text-[#3D524A] italic font-medium font-sans max-w-md mb-3">
                “A spotless home is peace of mind.”
              </p>

              {/* Compact Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                <Link
                  to="/book"
                  className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center gap-1.5 group cursor-pointer"
                >
                  <LuCalendar className="w-3.5 h-3.5" />
                  <span>Book a service</span>
                  <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={scrollToServices}
                  className="px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl bg-[#10231D] hover:bg-[#1E3B31] text-[#F4EFE6] font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Select service</span>
                  <LuChevronDown className="w-3.5 h-3.5 text-[#E9A23B] animate-bounce" />
                </button>

                <a
                  href={`tel:${settings?.phone || '+919897766002'}`}
                  className="p-2 sm:p-3 rounded-xl bg-white hover:bg-[#ECE5D8] text-[#10231D] border border-[#E2D9C8] transition-all flex items-center justify-center shadow-sm"
                  title="Direct Phone Dispatch"
                >
                  <LuPhoneCall className="w-3.5 h-3.5 text-[#E9A23B]" />
                </a>
              </div>

            </div>
          </div>

          {/* Bottom Bar: Trust Metrics & Scroll Cue (Bright & Solid Contrast Pill) */}
          <div className="container mx-auto px-0 md:px-4 relative z-30 pt-2">
            <div className="bg-[#F4EFE6]/92 backdrop-blur-md border border-[#E2D9C8] rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-4 text-xs text-[#10231D]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 font-bold text-[#10231D]">
                  <div className="flex text-[#E9A23B]">
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="font-mono ml-1 text-[#10231D]">4.92 / 5.0</span>
                  <span className="text-[#3D524A] font-medium hidden sm:inline">(5,000+ happy customers)</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-[#10231D] font-semibold">
                  <LuShieldCheck className="w-3.5 h-3.5 text-[#D48E28]" />
                  <span>100% Free Re-Clean Guarantee</span>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToServices}
                className="flex items-center gap-1.5 text-[#10231D] hover:text-[#D48E28] font-bold transition-colors cursor-pointer text-[11px] sm:text-xs"
              >
                <span>Service Catalog</span>
                <LuChevronDown className="w-3.5 h-3.5 text-[#E9A23B]" />
              </button>
            </div>
          </div>

        </section>

      </div>

      {/* ========================================================
          2. DYNAMIC QUICK SERVICE SELECTOR DOCK (ELEGANT LIGHT THEME)
          - 100% Dynamically driven by live database services
          - Accurate pricing guarantee across cards and ribbon
      ======================================================== */}
      <section id="quick-service-selector" className="relative z-20 py-8 sm:py-12 container mx-auto px-4">
        <div className="bg-white border border-[#E2D9C8] rounded-3xl p-5 sm:p-7 shadow-xl">
          
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#E2D9C8]">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C2512D] font-bold block mb-0.5">
                Popular Services
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-[#10231D]">
                Select What Needs Cleaning
              </h2>
            </div>
          </div>

          {/* Dynamic 8 Grid Tiles featuring 3D REALISTIC MINIATURE ICONS & ACCURATE PRICING */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
            {dynamicHeroServices.map((item) => {
              const isSelected = selectedService?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(item.id);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-2.5 group ${
                    isSelected
                      ? 'bg-[#E9A23B] text-[#181511] border-[#E9A23B] shadow-xl scale-[1.05]'
                      : 'bg-[#F8F5EE] hover:bg-[#EFE8DA] text-[#10231D] border-[#E2D9C8] hover:border-[#D4C8B4] hover:shadow-md'
                  }`}
                >
                  {/* Realistic 3D Miniature Object Icon on Clean Background with 3D Depth */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center p-2 sm:p-2.5 transition-all duration-300 group-hover:scale-110 ${
                    isSelected
                      ? 'bg-white/40 shadow-[0_4px_14px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.8)] border border-white/50'
                      : 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] border border-[#E2D9C8]'
                  }`}>
                    {getServiceIcon(
                      item.rawService || item,
                      'w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)] transition-all duration-300 group-hover:scale-115 group-hover:-translate-y-1 group-hover:drop-shadow-[0_14px_20px_rgba(0,0,0,0.25)]'
                    )}
                  </div>

                  <div>
                    <p className={`text-xs font-bold leading-tight line-clamp-1 ${isSelected ? 'text-[#181511]' : 'text-[#10231D]'}`}>
                      {item.title}
                    </p>
                    <span className={`text-[11px] font-mono font-bold block mt-0.5 ${isSelected ? 'text-[#181511]/90' : 'text-[#C2512D]'}`}>
                      From ₹{Number(item.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Service Quick Action Ribbon */}
          {selectedService && (
            <div className="pt-4 border-t border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 sm:p-2.5 border border-[#E2D9C8] shrink-0 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]">
                  {getServiceIcon(
                    selectedService.rawService || selectedService,
                    'w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)]'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-[#10231D] font-display">
                      {selectedService.title}
                    </h3>
                    <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      Starting at ₹{Number(selectedService.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C7067] mt-0.5">
                    {selectedService.subtitle} · Certified Max Housekeeping Specialists
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/services/${selectedService.slug}`}
                  className="px-4 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE3D4] text-[#10231D] font-bold text-xs transition-colors border border-[#E2D9C8]"
                >
                  Service Details
                </Link>
                <button
                  type="button"
                  onClick={() => handleAddToCart(selectedService)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center gap-2 cursor-pointer group ${
                    addedAnim
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511]'
                  }`}
                >
                  {addedAnim ? (
                    <>
                      <LuCheck className="w-4 h-4 text-white" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <LuShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
