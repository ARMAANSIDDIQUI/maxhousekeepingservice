import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuSparkles,
  LuShieldCheck,
  LuClock,
  LuStar,
  LuArrowRight,
  LuCheck,
  LuCalendar,
  LuAward,
  LuPlay
} from 'react-icons/lu';
import { apiRequest } from '../api';
import { useBooking } from '../context/BookingContext';
import RoomMap from '../components/home/RoomMap';
import DirtyCleanReveal from '../components/home/DirtyCleanReveal';
import SEO from '../components/common/SEO';
import FAQSection from '../components/common/FAQSection';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const { addItem, selectedCity, settings } = useBooking();

  const nextOpenDateLabel = React.useMemo(() => {
    const closed = new Set((settings?.closedBookingDates || []).map(c => c.date));
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const iso = d.toISOString().split('T')[0];
      if (!closed.has(iso)) {
        return i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      }
      d.setDate(d.getDate() + 1);
    }
    return 'Check booking page';
  }, [settings?.closedBookingDates]);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, allSrvsRes, brandsRes, testsRes] = await Promise.allSettled([
          apiRequest('/categories'),
          apiRequest('/services'),
          apiRequest('/public/brands'),
          apiRequest('/public/testimonials')
        ]);

        if (catsRes.status === 'fulfilled' && catsRes.value?.categories && catsRes.value.categories.length > 0) {
          setCategories(catsRes.value.categories);
        } else {
          setCategories([]);
        }

        if (allSrvsRes.status === 'fulfilled' && allSrvsRes.value?.services && allSrvsRes.value.services.length > 0) {
          const srvList = allSrvsRes.value.services;
          setAllServices(srvList);
          const popular = srvList.filter(s => s.isPopular);
          setFeaturedServices(popular.length > 0 ? popular : srvList.slice(0, 4));
        } else {
          setAllServices([]);
          setFeaturedServices([]);
        }

        if (brandsRes.status === 'fulfilled' && brandsRes.value?.brands && brandsRes.value.brands.length > 0) {
          setBrands(brandsRes.value.brands);
        } else {
          setBrands([]);
        }

        if (testsRes.status === 'fulfilled' && testsRes.value?.testimonials && testsRes.value.testimonials.length > 0) {
          setTestimonials(testsRes.value.testimonials);
        } else {
          setTestimonials([]);
        }
      } catch (err) {
        console.warn('Network error loading home data:', err);
        setCategories([]);
        setFeaturedServices([]);
        setAllServices([]);
        setBrands([]);
        setTestimonials([]);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title="Max Housekeeping Service | Professional Cleaning in Western UP"
        description="Top-rated home deep cleaning, bathroom sanitisation, kitchen degreasing, sofa shampooing & commercial cleaning across Moradabad, Rampur, Amroha, Sambhal, and Western Uttar Pradesh."
      />
      {/* 1. Hero — editorial layout with interactive dirty→clean reveal */}
      <section className="relative bg-[#F4EFE6] border-b-2 border-[#10231D] overflow-hidden">
        {/* blueprint grid backdrop */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#10231D 1px, transparent 1px), linear-gradient(90deg, #10231D 1px, transparent 1px)',
            backgroundSize: '44px 44px'
          }}
        />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#E9A23B]/25 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10231D] text-[#F4EFE6] text-[11px] font-mono font-bold uppercase tracking-widest mb-5">
                <span className="w-2 h-2 rounded-full bg-[#E9A23B] animate-pulse" />
                <span>Moradabad · Rampur · Sambhal · Amroha</span>
              </div>

              <h1 className="font-display font-black text-[2.6rem] sm:text-6xl lg:text-7xl text-[#10231D] leading-[0.98] tracking-tighter mb-5">
                We turn
                <span className="block text-transparent [-webkit-text-stroke:2px_#10231D] italic">grime</span>
                into <span className="relative inline-block">
                  <span className="relative z-10">glow.</span>
                  <span className="absolute left-0 right-0 bottom-1 sm:bottom-2 h-3 sm:h-4 bg-[#E9A23B] -z-0 -rotate-1" />
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#3D524A] leading-relaxed max-w-lg mb-7">
                A supervised crew, real machines, and a live GPS radar — so you can
                watch your cleaning team roll up to your door.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Link
                  to="/book"
                  className="px-6 py-3.5 rounded-xl bg-[#10231D] hover:bg-[#E9A23B] hover:text-[#10231D] text-[#F4EFE6] font-black text-sm transition-colors flex items-center gap-2 shadow-[4px_4px_0_0_#E9A23B]"
                >
                  <LuCalendar className="w-4 h-4" />
                  <span>Book a clean</span>
                </Link>
                <Link
                  to="/services"
                  className="px-6 py-3.5 rounded-xl border-2 border-[#10231D] text-[#10231D] font-bold text-sm hover:bg-[#10231D] hover:text-[#F4EFE6] transition-colors flex items-center gap-2"
                >
                  <span>Browse services</span>
                  <LuArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-3 border-2 border-[#10231D] rounded-2xl overflow-hidden bg-white/60 max-w-md">
                {[
                  { n: '4.9★', l: 'Avg rating' },
                  { n: '3 hr', l: 'Arrival windows' },
                  { n: 'Live', l: 'GPS tracking' }
                ].map((s, i) => (
                  <div key={s.l} className={`px-3 py-3 text-center ${i < 2 ? 'border-r-2 border-[#10231D]' : ''}`}>
                    <div className="font-display font-black text-xl text-[#10231D] leading-none">{s.n}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B8077] mt-1">{s.l}</div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs font-mono text-[#3D524A]">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 align-middle" />
                Next open date: <strong className="text-[#10231D]">{nextOpenDateLabel}</strong>
              </p>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 relative">
              <DirtyCleanReveal className="aspect-[4/3] sm:aspect-[5/4] w-full" />
              <div className="hidden sm:flex absolute -bottom-5 -left-4 items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E9A23B] border-2 border-[#10231D] text-[#10231D] text-xs font-black rotate-[-3deg] shadow-[4px_4px_0_0_#10231D]">
                <LuShieldCheck className="w-4 h-4" /> Verified crew · Eco-safe
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t-2 border-[#10231D] bg-[#10231D] text-[#F4EFE6] overflow-hidden py-2.5">
          <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-mono uppercase tracking-widest w-max">
            {[...Array(2)].flatMap((_, k) =>
              ['Deep cleaning', 'Sofa extraction', 'Kitchen degreasing', 'Bathroom descaling', 'Marble buffing', 'Water tank cleaning', 'Office housekeeping'].map((t) => (
                <span key={`${k}-${t}`} className="flex items-center gap-8">
                  <span>{t}</span>
                  <span className="text-[#E9A23B]">✦</span>
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How it works — numbered editorial steps */}
      <section className="py-16 bg-[#F4EFE6] border-b border-[#E2D9C8]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-10">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#10231D] tracking-tighter leading-none">
              Four steps.<br className="hidden sm:block" /> Zero chasing.
            </h2>
            <p className="text-sm text-[#3D524A] max-w-sm">
              From tapping “book” to a signed-off quality check — you see every stage.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '01', t: 'Pick & pin', d: 'Choose a service, drop a map pin or tap Locate Me.' },
              { n: '02', t: 'Choose a slot', d: 'Open dates only — sold-out days are clearly marked.' },
              { n: '03', t: 'Track the crew', d: 'Live GPS radar with your supervisor’s ETA and call button.' },
              { n: '04', t: 'Inspect & pay', d: 'Walk the 20-point check, then pay online or on completion.' }
            ].map((s, i) => (
              <div
                key={s.n}
                className={`relative p-6 rounded-3xl border-2 border-[#10231D] bg-white transition-transform hover:-translate-y-1 ${i % 2 ? 'lg:translate-y-6' : ''}`}
              >
                <div className="font-display font-black text-6xl text-transparent [-webkit-text-stroke:1.5px_#E9A23B] leading-none mb-3">{s.n}</div>
                <h3 className="font-display font-extrabold text-lg text-[#10231D] mb-1">{s.t}</h3>
                <p className="text-xs text-[#3D524A] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="hidden lg:block h-6" />
        </div>
      </section>


      {/* 2. All 15 Enterprise Brand Partners Infinite Marquee */}
      {brands.length > 0 && (
        <section className="py-12 bg-[#ECE5D8] border-b border-[#E2D9C8] overflow-hidden">
          <div className="container mx-auto px-4 mb-6 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#F4EFE6] text-[#10231D] text-[11px] font-bold tracking-widest uppercase mb-2">
              Trusted Partners
            </span>
            <h3 className="font-display font-extrabold text-2xl text-[#10231D]">
              Brands We've Worked With
            </h3>
            <p className="text-xs text-[#6B8077] mt-1">
              Proud to have served homes, offices and businesses of these brands across Western UP.
            </p>
          </div>

          <div
            className="relative overflow-hidden w-full"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
              maskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)'
            }}
          >
            <div className="animate-marquee flex items-center gap-5 py-2">
              {/* Duplicate brands list to create seamless infinite loop */}
              {[...brands, ...brands].map((b, bIdx) => (
                <div
                  key={`${b.name}-${bIdx}`}
                  className="group flex h-24 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#10231D]/[0.08] bg-white px-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  title={b.name}
                >
                  <img
                    src={b.logoUrl}
                    alt={b.name}
                    loading="lazy"
                    className="max-h-12 w-auto max-w-full object-contain filter group-hover:contrast-125 transition-all"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Six Main Categories Grid with Real Photos */}
      {categories.length > 0 && (
        <section className="py-20 bg-[#F4EFE6]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="chip mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E9A23B]"></span>
                What we offer
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#10231D] tracking-tight mb-3">
                Cleaning Services for Every Corner
              </h2>
              <p className="text-sm text-[#3D524A]">
                From a quick bathroom refresh to a full-home deep clean — pick a category and we'll handle the rest.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/services?category=${cat.slug}`}
                  className="group rounded-2xl border border-[#E2D9C8] bg-[#ECE5D8]/70 hover:bg-[#ECE5D8] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={cat.image?.url || `/media/categories/${cat.slug}.jpg`}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.src = '/media/categories/home-deep-cleaning.jpg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10231D]/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                      <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#10231D]/80">
                        {cat.serviceCount > 0 ? `${cat.serviceCount} services` : 'Packages Available'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#10231D] group-hover:text-[#E9A23B] transition-colors mb-2">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#3D524A] leading-relaxed mb-4">
                        {cat.description || cat.tagline}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#10231D] pt-3 border-t border-[#E2D9C8]">
                      <span>View Packages</span>
                      <LuArrowRight className="w-4 h-4 text-[#E9A23B] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Interactive Blueprint Room Map */}
      <RoomMap services={allServices} />

      {/* 5. Most-Booked Services with Live Dual-Pricing (MRP vs Offered Price) */}
      {featuredServices.length > 0 && (
        <section className="py-20 bg-[#F4EFE6] border-t border-[#E2D9C8]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <div className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B] mb-2">
                  Popular picks
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-[#10231D] tracking-tight">
                  Most-Booked Services
                </h2>
                <p className="text-xs text-[#6B8077] mt-1">
                  Loved by thousands of customers across Western Uttar Pradesh.
                </p>
              </div>
            <Link
              to="/services"
              className="mt-4 md:mt-0 text-sm font-bold text-[#10231D] hover:text-[#E9A23B] flex items-center gap-1.5 transition-colors"
            >
              <span>View All Services</span>
              <LuArrowRight className="w-4 h-4 text-[#E9A23B]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.slice(0, 6).map((service) => {
              const savings = (service.mrp || service.price) - service.price;
              const discountPct = service.mrp ? Math.round(((service.mrp - service.price) / service.mrp) * 100) : 0;

              return (
                <div
                  key={service._id}
                  onClick={() => navigate(`/services/${service.slug}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/services/${service.slug}`);
                    }
                  }}
                  className="group rounded-2xl border border-[#E2D9C8] hover:border-[#E9A23B] bg-[#ECE5D8]/70 hover:bg-[#ECE5D8] p-6 flex flex-col justify-between shadow-xs hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#E9A23B]/60"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-[#6B8077] uppercase font-semibold">
                        {service.categoryName || 'Cleaning'}
                      </span>
                      {discountPct > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-black tracking-wide">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-xl text-[#10231D] group-hover:text-[#C2512D] transition-colors mb-2 leading-snug">
                      {service.title}
                    </h3>

                    <p className="text-xs text-[#3D524A] leading-relaxed mb-6 line-clamp-2">
                      {service.shortDescription || service.description}
                    </p>
                  </div>

                  {/* Dual Pricing Footer */}
                  <div className="pt-4 border-t border-[#E2D9C8]">
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="text-xs text-[#6B8077] block font-mono">Offered Price</span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-extrabold text-2xl text-[#10231D] tnum">
                            ₹{service.price?.toLocaleString('en-IN')}
                          </span>
                          {service.mrp > service.price && (
                            <span className="text-sm text-[#6B8077] line-through tnum">
                              ₹{service.mrp?.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {savings > 0 && (
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-[#E9A23B] block">
                            Save ₹{savings.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(service);
                      }}
                      className="w-full py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] active:scale-[0.98] text-[#181511] font-black text-xs transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Add to Booking</span>
                      <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* 6. Dynamic Admin-Managed Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-[#ECE5D8] border-t border-[#E2D9C8]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFE6] text-[#10231D] text-[11px] font-bold tracking-widest uppercase mb-3 border border-[#E2D9C8]">
                <LuStar className="w-3 h-3 text-[#E9A23B] fill-[#E9A23B]" />
                Customer Stories
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#10231D] tracking-tight">
                What Our Customers Say
              </h2>
              <p className="text-sm text-[#3D524A] mt-2">
                Real reviews from happy families and offices across Uttar Pradesh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((test, idx) => {
                const initials = (test.name || 'Client')
                  .split(' ')
                  .map(p => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={test._id || idx}
                    className={`p-6 rounded-2xl bg-[#F4EFE6] border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between ${
                      test.isFeatured
                        ? 'border-[#E9A23B] ring-1 ring-[#E9A23B]/30'
                        : 'border-[#E2D9C8]'
                    }`}
                  >
                    <div>
                      {/* Optional Video Testimonial Player */}
                      {test.videoUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden bg-black border border-[#E2D9C8]">
                          {/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(test.videoUrl) ||
                          test.videoUrl.includes('/video/upload/') ||
                          test.videoUrl.startsWith('data:video/') ? (
                            <video
                              src={test.videoUrl}
                              poster={test.avatar || undefined}
                              controls
                              preload="metadata"
                              playsInline
                              className="w-full h-48 object-cover bg-black"
                            />
                          ) : (
                            <a
                              href={test.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-[#10231D] text-[#F4EFE6] text-xs font-bold"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <LuPlay className="w-3.5 h-3.5 text-[#E9A23B] fill-[#E9A23B]" />
                                Watch Video Testimonial
                              </span>
                              <LuArrowRight className="w-3.5 h-3.5 text-[#E9A23B]" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Top Bar: Stars & Verified Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-0.5 text-[#E9A23B]">
                          {[...Array(test.rating || 5)].map((_, starIdx) => (
                            <LuStar key={starIdx} className="w-4 h-4 fill-[#E9A23B]" />
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10231D] bg-[#ECE5D8] px-2 py-0.5 rounded-full">
                          <LuShieldCheck className="w-3 h-3 text-[#E9A23B]" />
                          Verified
                        </span>
                      </div>

                      {test.serviceTitle && (
                        <div className="mb-2">
                          <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ECE5D8] text-[#10231D]">
                            {test.serviceTitle}
                          </span>
                        </div>
                      )}

                      {/* Review Quote */}
                      {test.quote && (
                        <p className="text-sm text-[#3D524A] leading-relaxed italic mb-6">
                          "{test.quote}"
                        </p>
                      )}
                    </div>

                    {/* Author Footer with Uploaded Avatar Support */}
                    <div className="pt-4 border-t border-[#E2D9C8] flex items-center gap-3">
                      {test.avatar ? (
                        <img
                          src={test.avatar}
                          alt={test.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-[#E9A23B] shadow-sm shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#10231D] text-[#E9A23B] font-display font-bold text-sm flex items-center justify-center border-2 border-[#E9A23B]/40 shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h4 className="font-display font-bold text-sm text-[#10231D] truncate">
                          {test.name}
                        </h4>
                        <p className="text-xs text-[#6B8077] truncate">
                          {test.role || 'Homeowner'} · <span className="text-[#10231D] font-medium">{test.city}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Frequently Asked Questions Section on Home Page */}
      <FAQSection
        className="bg-[#ECE5D8]/40 border-t border-[#E2D9C8]"
        title="Doorstep Cleaning FAQs"
        subtitle="Answers to common questions about booking, live supervisor tracking, transparent pricing, and closed dates."
      />

    </div>
  );
}
