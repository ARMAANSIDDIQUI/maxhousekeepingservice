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
  LuMail
} from 'react-icons/lu';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import { useBooking } from '../context/BookingContext';
import { apiRequest } from '../api';
import SEO from '../components/common/SEO';

const EQUIPMENT_INVENTORY = [
  {
    title: 'Single-Disc Rotary Floor Scrubbers (175 RPM)',
    spec: 'Marble, Kota Stone, Vitrified Tile & Granite Buffing',
    detail:
      'Used for deep floor scrubbing and edge-to-edge grout dirt extraction in independent kothis, flats, and commercial showrooms without scratching delicate stone surfaces.'
  },
  {
    title: 'Wet & Dry Injection-Extraction Machines',
    spec: 'Fabric Sofa, Mattress, Carpet & Curtain Shampooing',
    detail:
      'Injects low-moisture Taski foam deep into upholstery fibers and immediately vacuums out 85%+ of dirty water, sweat, dust mites, and food stains for fast 3–4 hour drying.'
  },
  {
    title: 'High-Pressure Jet & Steam Degreasers',
    spec: 'Modular Kitchen Chimneys, Exhausts, Balconies & Driveways',
    detail:
      'Cuts through baked-on oil, turmeric stains, and carbon buildup inside kitchen chimneys, gas hobs, exhaust fans, and exterior stone pathways.'
  },
  {
    title: 'Taski (Diversey) & 3M Hospital-Grade Chemicals',
    spec: 'Non-Acidic, Child-Safe & Pet-Safe Formulations',
    detail:
      'We strictly ban raw acid (tezaab) that ruins expensive Jaguar/Kohler chrome taps and tile grout. Instead, we use pH-balanced Taski R1–R6 descalers and disinfectants.'
  },
  {
    title: 'Industrial HEPA Dual-Motor Vacuums',
    spec: 'Dry Dusting, Sofa Crevices, Window Channels & False Ceilings',
    detail:
      'Captures fine construction cement dust, ceiling fan cobwebs, sliding UPVC window track grit, and deep mattress allergens before wet wiping begins.'
  },
  {
    title: 'Odorless Bayer Herbal Gel & Spray Systems',
    spec: 'Cockroach, Ant, Termite & Wood-Borer Protection',
    detail:
      'Applied inside kitchen hinges, sink under-cabinets, and drainage traps—no foul smell, no need to empty kitchen utensils or vacate your home.'
  }
];

const SERVICE_SCOPE_COMPARISON = [
  {
    area: 'Bathrooms & Washrooms',
    localMaid: 'Quick floor mop with phenyl or harsh raw acid that blackens steel taps and erodes tile joints.',
    maxStandard:
      'Machine scrubbing of wall & floor tiles, non-acidic hard-water scaling removal from taps/showers, WC & washbasin sanitization, mirror glass polishing, and exhaust fan cleaning.'
  },
  {
    area: 'Modular Kitchen & Chimney',
    localMaid: 'Surface wiping of slab only; sticky oil layers remain on top cabinets, chimney filters, and wall tiles.',
    maxStandard:
      'Complete degreasing of chimney hood & baffle filters, gas stove, wall tiles, outer/inner cabinet laminates (emptied or arranged), sink descaling, and appliance exterior wiping.'
  },
  {
    area: 'Living Room & Bedrooms',
    localMaid: 'Basic broom sweep and wet cloth mop; ceiling fans, window tracks, and sofa fabric stay dusty.',
    maxStandard:
      'Single-disc rotary floor scrubbing, cobweb removal, ceiling fan & chandelier dry-wipe, UPVC/wooden window channel vacuuming, wardrobe outer polishing, and switchboard detailing.'
  },
  {
    area: 'Sofas, Mattresses & Carpets',
    localMaid: 'Beating with a stick or wet cloth rubbing that pushes dirt deeper and leaves damp smell.',
    maxStandard:
      '3-step industrial dry vacuuming, Taski foam shampoo scrubbing, and high-suction wet extraction that pulls out embedded dirt and leaves fabric fresh and sanitised.'
  },
  {
    area: 'Post-Construction / Move-In Homes',
    localMaid: 'Cannot remove white cement splashes, paint drops, POP dust, or sticker glue from new glass.',
    maxStandard:
      'Dedicated 4–6 member crew with scrapers, industrial vacuums, solvent spot-removers, and floor buffing machines to make newly built or renovated homes ready for Griha Pravesh.'
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Transparent Online or Call Booking',
    desc: 'Select your exact package (Full Home 1–5 BHK, Bathroom, Kitchen, Sofa seats, or Commercial sq.ft.) with upfront rates—or call +91 98977 66002 for a custom inspection.'
  },
  {
    step: '02',
    title: 'Uniformed Crew & Van Dispatch',
    desc: 'Our background-verified team arrives on time from our Kanth Road, Moradabad hub carrying all machines, extension cords, ladders, microfiber cloths, and Taski chemicals.'
  },
  {
    step: '03',
    title: 'Supervisor-Led Room-by-Room Execution',
    desc: 'A dedicated field supervisor oversees dry vacuuming, chemical foaming, rotary scrubbing, and detail polishing across every room on your checklist.'
  },
  {
    step: '04',
    title: 'Walkthrough Inspection & Satisfaction Sign-Off',
    desc: 'You inspect every corner—tiles, taps, kitchen cabinets, and window tracks—before the team packs up. If any spot needs a touch-up, we redo it on the spot.'
  }
];

export default function AboutPage() {
  const { cities, settings } = useBooking();
  const [brands, setBrands] = useState([]);
  const [servicesCount, setServicesCount] = useState(16);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiRequest('/public/brands'),
      apiRequest('/services')
    ]).then(([brandsRes, srvsRes]) => {
      if (!active) return;
      if (brandsRes.status === 'fulfilled' && Array.isArray(brandsRes.value?.brands)) {
        setBrands(brandsRes.value.brands);
      }
      if (srvsRes.status === 'fulfilled' && Array.isArray(srvsRes.value?.services) && srvsRes.value.services.length > 0) {
        setServicesCount(srvsRes.value.services.length);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const displayCities = cities && cities.length > 0
    ? cities.map((c) => ({
        name: typeof c === 'string' ? c : (c.name || c.slug),
        pincodes: typeof c === 'object' && Array.isArray(c.pincodes) ? c.pincodes : [],
        radius: typeof c === 'object' && c.serviceRadiusKm ? c.serviceRadiusKm : 25
      }))
    : [
        { name: 'Moradabad', pincodes: ['244001', '244002', '244102', '244103', '244104'], radius: 30 },
        { name: 'Rampur', pincodes: ['244901', '244921'], radius: 25 },
        { name: 'Amroha', pincodes: ['244221', '244222'], radius: 25 },
        { name: 'Sambhal', pincodes: ['244302', '244303'], radius: 25 },
        { name: 'Chandausi', pincodes: ['244412'], radius: 25 },
        { name: 'Gajraula', pincodes: ['244235'], radius: 25 },
        { name: 'Bijnor', pincodes: ['246701'], radius: 25 },
        { name: 'Dhampur', pincodes: ['246761'], radius: 25 },
        { name: 'Noorpur', pincodes: ['246734'], radius: 25 },
        { name: 'Hassanpur', pincodes: ['244241'], radius: 25 },
        { name: 'Kashipur', pincodes: ['244713'], radius: 25 }
      ];

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
              Anyone who has built or renovated a home in <strong>Moradabad, Rampur, Amroha, Sambhal, or Bijnor</strong> knows the frustration of hiring untrained daily-wage cleaners—raw acid poured on expensive bathroom fittings, sticky oil left on modular kitchen cabinets, and wet sofas that smell for days.
            </p>

            <p className="text-sm sm:text-base text-[#3D524A] leading-relaxed font-sans">
              <strong>Max Housekeeping Service</strong> was founded right here in Moradabad (operating from <em>{hqAddress}</em>) to solve this exact problem. We operate our own mobile equipment vans, employ full-time uniformed technicians in our signature black-and-red attire, and bring industrial rotary scrubbers, wet-extraction vacuums, and non-acidic Taski chemicals directly to your doorstep.
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
                <span>Book a Cleaning Slot</span>
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

        {/* 6. REGIONAL COVERAGE & HEADQUARTERS DETAILS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Active Cities & Pincodes */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-[#10231D] text-[#F4EFE6] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#E9A23B] uppercase tracking-widest mb-2">
                <LuMapPin className="w-4 h-4" />
                <span>WESTERN UTTAR PRADESH & CORRIDOR COVERAGE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black mb-3">
                Direct Doorstep Dispatch Across {displayCities.length} Cities
              </h2>
              <p className="text-xs sm:text-sm text-[#DDEBE4]/85 leading-relaxed mb-6">
                Within <strong>Moradabad city (244001–244104)</strong>, our mobile vans arrive with zero outstation travel fee. For outstation bookings in Rampur, Amroha, Sambhal, Chandausi, Gajraula, Bijnor, Dhampur, Noorpur, Hassanpur, and Kashipur, our full crew travels directly to your location on scheduled slots:
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
