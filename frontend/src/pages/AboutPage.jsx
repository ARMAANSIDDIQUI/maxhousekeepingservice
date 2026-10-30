import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuShieldCheck,
  LuSparkles,
  LuUsers,
  LuMapPin,
  LuCheck,
  LuPhone,
  LuAward,
  LuClock,
  LuWrench,
  LuBuilding2,
  LuArrowRight,
  LuStar,
  LuCalendar,
  LuMail,
  LuVideo,
  LuPlay
} from 'react-icons/lu';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import { useBooking } from '../context/BookingContext';
import { apiRequest } from '../api';
import SEO from '../components/common/SEO';

const EQUIPMENT_INVENTORY = [
  {
    title: 'Single-Disc Floor Scrubbing Machine',
    spec: 'Marble, Vitrified Tiles, Porch & Hall Floors',
    detail:
      'Rotary brush and pad machine used across halls, bedrooms, verandahs, and commercial showrooms to lift stubborn floor grime and tile joint dirt that a normal mop cannot remove.'
  },
  {
    title: 'Foam Scrubber & Wet-Suction Vacuum',
    spec: 'Fabric Sofas, Dining Chairs, Mattresses & Carpets',
    detail:
      'Applies upholstery shampoo foam with a soft rotary brush to loosen sweat, dust, and food stains, followed by wet vacuum suction to pull out dirty water so fabric dries quickly.'
  },
  {
    title: 'High-Pressure Water Jet & Dewatering Pump',
    spec: 'Overhead Water Tanks, Swimming Pools & Driveways',
    detail:
      'Submersible sludge pump and high-pressure water jet washer used to drain, desilt, and pressure-wash overhead water tanks, swimming pools, balconies, and outdoor parking areas.'
  },
  {
    title: 'Non-Acidic Tile Descalers & Kitchen Degreasers',
    spec: 'Safe on Chrome Taps, Sanitaryware & Cabinets',
    detail:
      'We do not use raw market acid (tezaab) that turns steel taps black and eats away tile grout. We use safe bathroom descaling liquids, heavy-duty kitchen oil degreasers, and floor disinfectants.'
  },
  {
    title: 'Commercial Dry & Wet Barrel Vacuum',
    spec: 'Window Tracks, Sofa Crevices, Cobwebs & Dust',
    detail:
      'High-suction stainless-steel vacuum cleaner with crevice nozzles used to clear sliding window channels, sofa corners, ceiling cobwebs, and dry construction dust before wet cleaning.'
  },
  {
    title: 'Telescopic Poles, Glass Squeegees & Scrapers',
    spec: 'High Glass Panels, Fans, Chandeliers & Paint Spots',
    detail:
      'Complete hand-tool kit including ladders, telescopic dusters, glass wipers, paint/cement scrapers for newly built homes, and separate color-coded microfiber cloths for bathrooms and kitchens.'
  }
];

const SERVICE_SCOPE_COMPARISON = [
  {
    area: 'Bathrooms & Washrooms',
    localMaid: 'Quick floor mop with phenyl or harsh raw acid that blackens steel taps and damages tile joints.',
    maxStandard:
      'Thorough scrubbing of wall and floor tiles, non-acidic hard-water stain removal from taps and showers, WC and washbasin sanitization, mirror cleaning, and exhaust fan wiping.'
  },
  {
    area: 'Modular Kitchen & Chimney',
    localMaid: 'Surface wiping of slab only; sticky oil layers remain on top cabinets, chimney filters, and wall tiles.',
    maxStandard:
      'Complete degreasing of chimney hood and filters, gas stove, backsplash wall tiles, cabinet exteriors and interiors, steel trolleys, sink descaling, and appliance exterior wiping.'
  },
  {
    area: 'Living Room & Bedrooms',
    localMaid: 'Basic broom sweep and wet cloth mop; ceiling fans, window tracks, and doors stay dusty.',
    maxStandard:
      'Machine floor scrubbing, cobweb removal, ceiling fan and light fixture wiping, window glass and sliding track vacuuming, wardrobe outer cleaning, and switchboard wiping.'
  },
  {
    area: 'Sofas, Mattresses & Carpets',
    localMaid: 'Beating with a stick or wet cloth rubbing that pushes dirt deeper and leaves a damp smell.',
    maxStandard:
      'Dry vacuuming of dust, foam shampoo brushing across fabric and armrests, and wet vacuum water extraction that pulls out embedded dirt.'
  },
  {
    area: 'Post-Construction / Newly Built Homes',
    localMaid: 'Cannot remove white cement splashes, paint drops, POP dust, or sticker marks from new glass and tiles.',
    maxStandard:
      'Full crew with safety scrapers, dry/wet vacuums, stain removers, and floor scrubbing machines to clean newly built or renovated homes before moving in.'
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Transparent Online or Call Booking',
    desc: 'Select your exact service package (Full Home, Bathroom, Kitchen, Sofa seats, Water Tank, or Carpet/Pool) with clear upfront pricing—or call +91 98977 66002.'
  },
  {
    step: '02',
    title: 'Uniformed Crew & Equipment Arrival',
    desc: 'Our trained team arrives from our Kanth Road, Moradabad office carrying all required machines, extension boards, ladders, wipers, and cleaning liquids.'
  },
  {
    step: '03',
    title: 'Supervisor-Led Room-by-Room Cleaning',
    desc: 'A field supervisor oversees dry vacuuming, degreasing, machine floor scrubbing, and bathroom detailing across every area included in your booking.'
  },
  {
    step: '04',
    title: 'Final Walkthrough & Check',
    desc: 'You check every room—tiles, taps, kitchen cabinets, and window tracks—before the team packs up. Any missed spot is touched up immediately.'
  }
];

function getYoutubeEmbedUrl(url = '') {
  const clean = String(url).trim();
  const match = clean.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function AboutPage() {
  const { cities, settings } = useBooking();
  const [brands, setBrands] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialFilter, setTestimonialFilter] = useState('all'); // 'all' | 'video' | 'written'
  const [servicesCount, setServicesCount] = useState(16);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiRequest('/public/brands'),
      apiRequest('/services'),
      apiRequest('/public/testimonials')
    ]).then(([brandsRes, srvsRes, testsRes]) => {
      if (!active) return;
      if (brandsRes.status === 'fulfilled' && Array.isArray(brandsRes.value?.brands)) {
        setBrands(brandsRes.value.brands);
      }
      if (srvsRes.status === 'fulfilled' && Array.isArray(srvsRes.value?.services) && srvsRes.value.services.length > 0) {
        setServicesCount(srvsRes.value.services.length);
      }
      if (testsRes.status === 'fulfilled' && Array.isArray(testsRes.value?.testimonials)) {
        setTestimonials(testsRes.value.testimonials);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const videoTestimonialsCount = testimonials.filter((t) => Boolean(t.videoUrl)).length;
  const filteredTestimonials = testimonials.filter((t) => {
    if (testimonialFilter === 'video') return Boolean(t.videoUrl);
    if (testimonialFilter === 'written') return !t.videoUrl;
    return true;
  });

  const displayCities = Array.isArray(cities) && cities.length > 0
    ? cities.map((c) => ({
        name: typeof c === 'string' ? c : (c.name || c.slug),
        pincodes: typeof c === 'object' && Array.isArray(c.pincodes) ? c.pincodes : [],
        radius: typeof c === 'object' && c.serviceRadiusKm ? c.serviceRadiusKm : 25
      }))
    : [];

  const hqAddress =
    settings?.address ||
    'Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001';
  const hotline = settings?.phone || '+91 98977 66002';
  const whatsappClean = (settings?.whatsappNumber || '919897766002').replace(/[^0-9]/g, '');

  return (
    <div className="py-10 md:py-16 bg-[#F4EFE6] text-[#10231D]">
      <SEO
        title="About Max Housekeeping Service | Moradabad & Western UP's Mechanized Cleaning Team"
        description="Headquartered on Kanth Road behind Asian Vivekanand Hospital, Moradabad, Max Housekeeping Service provides mechanized home deep cleaning, sofa shampooing, bathroom descaling, and corporate facility management across Western Uttar Pradesh."
        keywords="about max housekeeping service, Moradabad cleaning company, Kanth Road cleaning service, mechanized home cleaning Western UP, commercial housekeeping Moradabad"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-20">
        {/* 1. HERO & REAL COMPANY OVERVIEW */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-14 border-b border-[#E2D9C8]">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DDEBE4] text-[#10231D] text-xs font-bold border border-[#10231D]/10">
              <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>HEADQUARTERED AT KANTH ROAD, MORADABAD (U.P. 244001)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-[#10231D] leading-[1.12]">
              Built in Moradabad to Replace Guesswork Cleaning with Real Machines & Trained Crews.
            </h1>

            <p className="text-base text-[#3D524A] leading-relaxed font-sans">
              Anyone who has built or renovated a home in <strong>Moradabad and neighboring Western UP cities</strong> knows the frustration of hiring untrained daily-wage cleaners—raw acid poured on expensive bathroom fittings, sticky oil left on modular kitchen cabinets, and wet sofas that smell for days.
            </p>

            <p className="text-sm sm:text-base text-[#3D524A] leading-relaxed font-sans">
              <strong>Max Housekeeping Service</strong> was founded right here in Moradabad (operating from <em>{hqAddress}</em>) to solve this exact problem. We operate our own equipment teams, employ full-time uniformed technicians in our signature black-and-red attire, and bring floor scrubbing machines, wet-suction vacuums, high-pressure water jets, and safe non-acidic cleaning liquids directly to your doorstep.
            </p>

            {/* Key Operational Facts Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <p className="font-display font-black text-2xl text-[#10231D]">10,000+</p>
                <p className="text-[11px] font-semibold text-[#3D524A]">Homes & Showrooms Cleaned</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <p className="font-display font-black text-2xl text-[#10231D]">{displayCities.length}+</p>
                <p className="text-[11px] font-semibold text-[#3D524A]">Active Cities in UP & UK</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <p className="font-display font-black text-2xl text-[#10231D]">15+</p>
                <p className="text-[11px] font-semibold text-[#3D524A]">Commercial Brand Clients</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
                <p className="font-display font-black text-2xl text-[#10231D]">8 AM – 8 PM</p>
                <p className="text-[11px] font-semibold text-[#3D524A]">7-Day Dispatch Desk</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/book"
                className="px-5 py-3 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center gap-2"
              >
                <LuCalendar className="w-4 h-4 text-[#E9A23B]" />
                <span>Book a Service</span>
              </Link>
              <a
                href={`tel:${hotline.replace(/[^0-9+]/g, '')}`}
                className="px-5 py-3 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] font-bold text-xs sm:text-sm border border-[#E2D9C8] transition-all flex items-center gap-2"
              >
                <LuPhone className="w-4 h-4 text-[#E9A23B]" />
                <span>Call {hotline}</span>
              </a>
              <a
                href={`https://wa.me/${whatsappClean}?text=Hello%20Max%20Housekeeping%20Service%2C%20I%20would%20like%20to%20enquire%20about%20cleaning%20services.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-[#25D366] hover:brightness-105 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>WhatsApp Dispatch</span>
              </a>
              <a
                href={settings?.instagramUrl || 'https://www.instagram.com/maxhousekeepingservice/'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <FaInstagram className="w-4 h-4" />
                <span>@maxhousekeepingservice</span>
              </a>
            </div>
          </div>

          {/* Right Column: Real Team & Field Photos */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl overflow-hidden border-2 border-[#10231D] shadow-xl bg-[#10231D] relative">
              <img
                src="/assets/uniform-team-reference.jpg"
                alt="Max Housekeeping Service uniformed field crew in Moradabad"
                className="w-full h-72 sm:h-80 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/media/services/full-home-deep-cleaning.jpg';
                }}
              />
              <div className="p-4 bg-[#10231D] text-[#F4EFE6] flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#E9A23B]">
                    OFFICIAL FIELD CREW & UNIFORM
                  </p>
                  <p className="text-xs text-[#DDEBE4]/90 mt-0.5">
                    ID-verified technicians in black & red uniform with supervisor oversight
                  </p>
                </div>
                <LuShieldCheck className="w-7 h-7 text-[#E9A23B] shrink-0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden border border-[#E2D9C8] bg-[#ECE5D8]">
                <img
                  src="/media/services/sofa-dry-cleaning.jpg"
                  alt="Mechanized Sofa Injection-Extraction Shampooing"
                  className="w-full h-28 object-cover"
                />
                <div className="p-2.5">
                  <p className="text-[11px] font-bold text-[#10231D]">Sofa & Carpet Extraction</p>
                  <p className="text-[10px] text-[#6B8077]">Wet shampoo + vacuum suction</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#E2D9C8] bg-[#ECE5D8]">
                <img
                  src="/media/services/kitchen-deep-cleaning.jpg"
                  alt="Modular Kitchen & Chimney Degreasing"
                  className="w-full h-28 object-cover"
                />
                <div className="p-2.5">
                  <p className="text-[11px] font-bold text-[#10231D]">Kitchen & Chimney Degrease</p>
                  <p className="text-[10px] text-[#6B8077]">Food-safe oil & carbon removal</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. COMMERCIAL & INSTITUTIONAL BRANDS WE SERVE */}
        <section className="space-y-6 pb-14 border-b border-[#E2D9C8]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E9A23B] block mb-1">
                COMMERCIAL & RETAIL TRACK RECORD
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#10231D]">
                Trusted by Leading Banks, Showrooms, Restaurants & Gyms
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#3D524A] max-w-md">
              Beyond residential bungalows and apartments in Civil Lines, Ram Ganga Vihar, and MDA Colony, our commercial division handles regular deep cleaning for national brands across Western UP:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {(brands.length > 0
              ? brands
              : [
                  { name: 'Tanishq Jewellery Showroom', logoUrl: '/brands/tanishq.jpg' },
                  { name: 'Bank of Baroda', logoUrl: '/brands/bank-of-baroda.jpg' },
                  { name: 'Punjab National Bank', logoUrl: '/brands/punjab-national-bank.jpg' },
                  { name: 'Bikanervala', logoUrl: '/brands/bikanervala.jpg' },
                  { name: "Gold's Gym", logoUrl: '/brands/goldgym.jpg' },
                  { name: 'Geetanjali Salon', logoUrl: '/brands/geetanjali-salon.jpg' },
                  { name: 'V-Mart Retail', logoUrl: '/brands/v-mart.jpg' },
                  { name: 'Red Tape Showroom', logoUrl: '/brands/redtape.jpg' },
                  { name: 'Subway', logoUrl: '/brands/subway.jpg' },
                  { name: 'Metro Shoes', logoUrl: '/brands/metro.jpg' },
                  { name: "Kundan's", logoUrl: '/brands/kundans.jpg' },
                  { name: 'Temptations', logoUrl: '/brands/temptations.jpg' }
                ]
            ).map((brand, idx) => (
              <div
                key={`${brand.name}-${idx}`}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#E2D9C8] shadow-xs hover:border-[#E9A23B] transition-all"
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  loading="lazy"
                  className="h-11 w-auto max-w-full object-contain mb-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-[11px] font-bold text-[#10231D] text-center line-clamp-1">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. MACHINERY & CHEMICAL INVENTORY (WHAT WE ACTUALLY BRING TO YOUR HOME) */}
        <section className="space-y-8 pb-14 border-b border-[#E2D9C8]">
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E9A23B] block mb-1">
              INDUSTRIAL EQUIPMENT & FORMULATIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#10231D] mb-2">
              What Our Mobile Van Brings to Your Doorstep
            </h2>
            <p className="text-sm text-[#3D524A] leading-relaxed">
              You never have to arrange brooms, buckets, ladders, or market phenyl. Every Max Housekeeping team brings a complete kit of commercial-grade machines and surface-specific chemicals:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EQUIPMENT_INVENTORY.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10231D] text-[#E9A23B] text-[10px] font-mono font-bold uppercase">
                    <LuWrench className="w-3 h-3" />
                    <span>{item.spec}</span>
                  </div>
                  <h3 className="text-base font-display font-bold text-[#10231D]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#3D524A] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. COMPARISON TABLE: UNTRAINED CASUAL LABOUR VS MAX HOUSEKEEPING */}
        <section className="space-y-6 pb-14 border-b border-[#E2D9C8]">
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E9A23B] block mb-1">
              WHY FAMILIES SWITCH TO MECHANIZED CLEANING
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#10231D] mb-2">
              Untrained Casual Cleaners vs. Max Housekeeping Standard
            </h2>
            <p className="text-sm text-[#3D524A]">
              Here is the exact difference in how we treat your home’s tiles, sanitaryware, modular kitchen, and upholstery across our {servicesCount}+ specialized packages:
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E2D9C8] bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#10231D] text-[#F4EFE6] text-xs font-mono uppercase">
                  <th className="p-4 border-b border-[#2D453B] w-1/5">Home / Office Area</th>
                  <th className="p-4 border-b border-[#2D453B] w-2/5 text-[#F4EFE6]/80">
                    Typical Untrained / Acid Cleaning
                  </th>
                  <th className="p-4 border-b border-[#2D453B] w-2/5 text-[#E9A23B]">
                    Max Housekeeping Mechanized Process
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9C8] text-xs">
                {SERVICE_SCOPE_COMPARISON.map((row) => (
                  <tr key={row.area} className="hover:bg-[#F4EFE6]/60 transition-colors">
                    <td className="p-4 font-bold text-[#10231D] align-top bg-[#F4EFE6]/40">
                      {row.area}
                    </td>
                    <td className="p-4 text-[#6B8077] align-top leading-relaxed">
                      {row.localMaid}
                    </td>
                    <td className="p-4 text-[#10231D] font-medium align-top leading-relaxed">
                      <div className="flex items-start gap-2">
                        <LuCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span>{row.maxStandard}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. 4-STEP FIELD EXECUTION PROTOCOL */}
        <section className="space-y-8 pb-14 border-b border-[#E2D9C8]">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E9A23B] block mb-1">
              HOW A BOOKING WORKS
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#10231D]">
              From Booking to Final Supervisor Sign-Off
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKFLOW_STEPS.map((w) => (
              <div
                key={w.step}
                className="p-6 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block font-mono font-black text-2xl text-[#E9A23B] mb-2">
                    {w.step}
                  </span>
                  <h3 className="text-base font-display font-bold text-[#10231D] mb-2">
                    {w.title}
                  </h3>
                  <p className="text-xs text-[#3D524A] leading-relaxed">
                    {w.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. DEDICATED CUSTOMER & VIDEO TESTIMONIALS SECTION */}
        <section id="testimonials" className="space-y-8 pb-14 border-b border-[#E2D9C8] scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-[#E9A23B] mb-1">
                <LuStar className="w-3.5 h-3.5 fill-[#E9A23B]" />
                <span>VERIFIED CUSTOMER FEEDBACK & VIDEO TESTIMONIALS</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#10231D]">
                What Homeowners & Businesses Say About Our Work
              </h2>
              <p className="text-xs sm:text-sm text-[#3D524A] mt-1">
                Watch real client video reviews and read verified feedback from families and commercial spaces we have cleaned.
              </p>
            </div>

            {videoTestimonialsCount > 0 && (
              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#ECE5D8] border border-[#E2D9C8] self-start">
                {[
                  { id: 'all', label: `All (${testimonials.length})` },
                  { id: 'video', label: `Video Reviews (${videoTestimonialsCount})` },
                  { id: 'written', label: `Written (${testimonials.length - videoTestimonialsCount})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTestimonialFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      testimonialFilter === tab.id
                        ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                        : 'text-[#3D524A] hover:text-[#10231D]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredTestimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestimonials.map((test, idx) => {
                const initials = (test.name || 'Client')
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const ytEmbed = test.videoUrl ? getYoutubeEmbedUrl(test.videoUrl) : null;
                const isDirectVideo =
                  test.videoUrl &&
                  (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(test.videoUrl) ||
                    test.videoUrl.includes('/video/upload/') ||
                    test.videoUrl.startsWith('data:video/'));

                return (
                  <div
                    key={test._id || idx}
                    className={`rounded-2xl bg-[#ECE5D8] border overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                      test.isFeatured
                        ? 'border-[#E9A23B] ring-1 ring-[#E9A23B]/30'
                        : 'border-[#E2D9C8]'
                    }`}
                  >
                    <div>
                      {/* Video Player if Video Testimonial */}
                      {test.videoUrl && (
                        <div className="relative bg-black border-b border-[#E2D9C8]">
                          {isDirectVideo ? (
                            <video
                              src={test.videoUrl}
                              poster={test.avatar || undefined}
                              controls
                              preload="metadata"
                              playsInline
                              className="w-full h-56 object-cover bg-black"
                            />
                          ) : ytEmbed ? (
                            <iframe
                              src={ytEmbed}
                              title={`${test.name} Video Testimonial`}
                              className="w-full h-56"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <a
                              href={test.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-4 bg-[#10231D] text-[#F4EFE6] hover:bg-[#1A332B] transition-colors"
                            >
                              <span className="inline-flex items-center gap-2 text-xs font-bold">
                                <LuPlay className="w-4 h-4 text-[#E9A23B] fill-[#E9A23B]" />
                                Watch Customer Video Review
                              </span>
                              <LuArrowRight className="w-4 h-4 text-[#E9A23B]" />
                            </a>
                          )}
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10231D]/90 text-[#E9A23B] text-[10px] font-mono font-bold uppercase backdrop-blur-xs">
                            <LuVideo className="w-3 h-3" /> Video Testimonial
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-0.5 text-[#E9A23B]">
                            {[...Array(test.rating || 5)].map((_, sIdx) => (
                              <LuStar key={sIdx} className="w-4 h-4 fill-[#E9A23B]" />
                            ))}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10231D] bg-[#F4EFE6] px-2.5 py-0.5 rounded-full border border-[#E2D9C8]">
                            <LuShieldCheck className="w-3 h-3 text-[#E9A23B]" />
                            Verified Client
                          </span>
                        </div>

                        {test.serviceTitle && (
                          <div className="mb-2.5">
                            <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#10231D]/10 text-[#10231D]">
                              {test.serviceTitle}
                            </span>
                          </div>
                        )}

                        {test.quote && (
                          <p className="text-xs sm:text-sm text-[#3D524A] leading-relaxed italic">
                            "{test.quote}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-[#F4EFE6]/70 border-t border-[#E2D9C8] flex items-center gap-3">
                      {test.avatar ? (
                        <img
                          src={test.avatar}
                          alt={test.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#E9A23B] shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#10231D] text-[#E9A23B] font-display font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h4 className="font-display font-bold text-xs sm:text-sm text-[#10231D] truncate">
                          {test.name}
                        </h4>
                        <p className="text-[11px] text-[#6B8077] truncate">
                          {test.role || 'Homeowner'} ·{' '}
                          <span className="text-[#10231D] font-semibold">{test.city}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] text-center">
              <p className="text-sm font-bold text-[#10231D]">
                Customer reviews and video testimonials are being updated.
              </p>
              <p className="text-xs text-[#6B8077] mt-1">
                Visit our official Instagram{' '}
                <a
                  href={settings?.instagramUrl || 'https://www.instagram.com/maxhousekeepingservice/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#10231D] font-bold underline"
                >
                  @maxhousekeepingservice
                </a>{' '}
                to watch live site transformation videos.
              </p>
            </div>
          )}
        </section>

        {/* 7. REGIONAL COVERAGE & HEADQUARTERS DETAILS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Active Cities & Pincodes */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-[#10231D] text-[#F4EFE6] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#E9A23B] uppercase tracking-widest mb-2">
                <LuMapPin className="w-4 h-4" />
                <span>WESTERN UTTAR PRADESH & CORRIDOR COVERAGE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black mb-3">
                Direct Doorstep Dispatch Across {displayCities.length || 'Our Operational'} Cities
              </h2>
              <p className="text-xs sm:text-sm text-[#DDEBE4]/85 leading-relaxed mb-6">
                Within <strong>Moradabad city (244001–244104)</strong>, our teams arrive with zero outstation travel fee. For outstation bookings across our active operational cities, our full crew travels directly to your location on scheduled slots:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayCities.map((c) => (
                  <div
                    key={c.name}
                    className="p-3 rounded-xl bg-[#1A332B] border border-[#2D453B] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <LuCheck className="w-4 h-4 text-[#E9A23B] shrink-0" />
                      <span className="text-xs font-bold text-[#F4EFE6]">{c.name}</span>
                    </div>
                    {c.pincodes && c.pincodes.length > 0 && (
                      <span className="text-[10px] font-mono text-[#DDEBE4]/75">
                        {c.pincodes.slice(0, 2).join(', ')}
                        {c.pincodes.length > 2 ? ` +${c.pincodes.length - 2}` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#2D453B] flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-[#DDEBE4]/80">
                Need a custom quote for a factory, hospital, banquet hall, or school?
              </span>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E9A23B] hover:underline"
              >
                <span>Request Commercial Inspection</span>
                <LuArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Moradabad Headquarters & Direct Contact Card */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10231D] text-[#E9A23B] text-[11px] font-mono font-bold uppercase">
                <LuBuilding2 className="w-3.5 h-3.5" />
                <span>Headquarters & Dispatch Center</span>
              </div>

              <h3 className="text-2xl font-display font-black text-[#10231D]">
                Visit or Contact Our Moradabad Office
              </h3>

              <div className="space-y-3 pt-2 text-xs text-[#3D524A]">
                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8]">
                  <span className="text-[10px] font-mono uppercase text-[#6B8077] block mb-1">
                    Registered Office & Equipment Hub
                  </span>
                  <p className="font-bold text-[#10231D] text-sm leading-snug">
                    {hqAddress}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] block mb-0.5">
                      Direct Booking & Support Hotline
                    </span>
                    <a
                      href={`tel:${hotline.replace(/[^0-9+]/g, '')}`}
                      className="font-display font-bold text-base text-[#10231D] hover:text-[#E9A23B]"
                    >
                      {hotline}
                    </a>
                  </div>
                  <LuPhone className="w-5 h-5 text-[#E9A23B]" />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] block mb-0.5">
                      Official Email
                    </span>
                    <a
                      href={`mailto:${settings?.email || 'contactmaxhousekeepingservice@gmail.com'}`}
                      className="font-semibold text-xs text-[#10231D] hover:text-[#E9A23B] break-all"
                    >
                      {settings?.email || 'contactmaxhousekeepingservice@gmail.com'}
                    </a>
                  </div>
                  <LuMail className="w-5 h-5 text-[#E9A23B] shrink-0" />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2D9C8] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#6B8077] block mb-0.5">
                      Operating Hours
                    </span>
                    <p className="font-semibold text-xs text-[#10231D]">
                      {settings?.workingHours || '8:00 AM – 8:00 PM (Monday – Sunday)'}
                    </p>
                  </div>
                  <LuClock className="w-5 h-5 text-[#E9A23B] shrink-0" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/services"
                className="flex-1 py-3 px-4 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] text-xs font-bold text-center transition-all"
              >
                Explore All {servicesCount} Services
              </Link>
              <Link
                to="/book"
                className="flex-1 py-3 px-4 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] text-[#181511] text-xs font-bold text-center transition-all"
              >
                Book Instant Slot
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
