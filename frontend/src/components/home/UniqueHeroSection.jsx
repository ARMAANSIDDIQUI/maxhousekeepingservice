import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const heroVideoSrc = settings?.heroVideoUrl || '/media/site/home_hero.mp4';

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
          - Desktop/Tablet: Dynamically equal to screen (100vw x 100vh below nav)
          - Mobile: Reduced height with gentle white-grey framing on sides
          - Video: Bright and unobstructed, content shifted down
      ======================================================== */}
      <div className="w-full px-3 sm:px-6 pt-3 sm:pt-4 md:px-0 md:pt-0">
        
        <section className="relative w-full overflow-hidden rounded-3xl md:rounded-none bg-[#07130F] h-[55vh] min-h-[350px] max-h-[460px] md:h-[calc(100vh-68px)] md:min-h-0 md:max-h-none flex flex-col justify-end p-4 sm:p-6 md:p-10 lg:p-14 shadow-lg md:shadow-none">
          
          {/* Looping Cinematic Background Video - Clearly Visible */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.03]"
              poster="/media/site/hero-clean-home.jpg"
            >
              <source src={heroVideoSrc} type="video/mp4" />
            </video>

            {/* Ultra-Gentle Bottom Scrim (Leaves 75%+ of Upper Video Completely Clear) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          </div>

          {/* Ultra-Compact Bottom-Aligned Content (Maximum Video Visibility) */}
          <div className="container mx-auto px-0 md:px-4 relative z-10 mt-auto pb-1 sm:pb-3">
            <div className="max-w-2xl">
              
              {/* Sleek Compact Headline */}
              <h1 className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-white leading-snug mb-1 drop-shadow-md">
                Spotless homes. <span className="text-[#E9A23B]">Zero stress.</span>
              </h1>

              {/* Crisp Attention-Grabbing Line */}
              <p className="text-[11px] sm:text-xs md:text-sm text-white/90 italic font-sans max-w-md mb-2.5 sm:mb-3 drop-shadow-xs">
                “A spotless home is peace of mind.”
              </p>

              {/* Compact Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                <Link
                  to="/book"
                  className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center gap-1.5 group cursor-pointer"
                >
                  <LuCalendar className="w-3.5 h-3.5" />
                  <span>Book a service</span>
                  <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={scrollToServices}
                  className="px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Select service</span>
                  <LuChevronDown className="w-3.5 h-3.5 text-[#E9A23B] animate-bounce" />
                </button>

                <a
                  href={`tel:${settings?.phone || '+919897766002'}`}
                  className="p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all flex items-center justify-center shadow-md"
                  title="Direct Phone Dispatch"
                >
                  <LuPhoneCall className="w-3.5 h-3.5 text-[#E9A23B]" />
                </a>
              </div>

            </div>
          </div>

          {/* Bottom Bar: Trust Metrics & Scroll Cue */}
          <div className="container mx-auto px-0 md:px-4 relative z-10 pt-3 md:pt-4 border-t border-white/15">
            <div className="flex items-center justify-between gap-4 text-xs text-white/80">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <div className="flex text-[#E9A23B]">
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                    <LuStar className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="font-mono ml-1">4.92 / 5.0</span>
                  <span className="text-white/70 font-normal hidden sm:inline">(5,000+ happy customers)</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-white/80">
                  <LuShieldCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
                  <span>100% Free Re-Clean Guarantee</span>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToServices}
                className="flex items-center gap-1.5 text-white/80 hover:text-white font-semibold transition-colors cursor-pointer text-[11px] sm:text-xs"
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
                  className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-2 group ${
                    isSelected
                      ? 'bg-[#E9A23B] text-[#181511] border-[#E9A23B] shadow-lg scale-[1.05]'
                      : 'bg-[#F8F5EE] hover:bg-[#EFE8DA] text-[#10231D] border-[#E2D9C8] hover:border-[#D4C8B4]'
                  }`}
                >
                  {/* Realistic 3D Miniature Object Icon on Clean Background */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center p-1.5 transition-transform group-hover:scale-110 ${
                    isSelected ? 'bg-white/30 shadow-xs' : 'bg-white shadow-2xs border border-[#E2D9C8]/60'
                  }`}>
                    {getServiceIcon(item.realisticIconKey, 'w-full h-full object-contain drop-shadow-sm')}
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
                <div className="w-14 h-14 rounded-2xl bg-[#F8F5EE] p-1.5 border border-[#E2D9C8] shrink-0 flex items-center justify-center shadow-xs">
                  {getServiceIcon(selectedService.realisticIconKey, 'w-full h-full object-contain drop-shadow-xs')}
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
