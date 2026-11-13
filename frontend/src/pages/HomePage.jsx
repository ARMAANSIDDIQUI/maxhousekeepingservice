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
  LuAward
} from 'react-icons/lu';
import { apiRequest } from '../api';
import { useBooking } from '../context/BookingContext';
import RoomMap from '../components/home/RoomMap';
import UniqueHeroSection from '../components/home/UniqueHeroSection';
import SEO from '../components/common/SEO';
import FAQSection from '../components/common/FAQSection';
import { getServiceIcon } from '../utils/iconHelper';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const { addItem, selectedCity, settings } = useBooking();


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
          const cleanCats = catsRes.value.categories.filter(c => 
            !c.slug?.toLowerCase().includes('pest') && 
            !c.name?.toLowerCase().includes('pest')
          );
          setCategories(cleanCats);
        } else {
          setCategories([]);
        }

        if (allSrvsRes.status === 'fulfilled' && allSrvsRes.value?.services && allSrvsRes.value.services.length > 0) {
          const srvList = allSrvsRes.value.services.filter(s =>
            !s.slug?.toLowerCase().includes('pest') &&
            !s.title?.toLowerCase().includes('pest') &&
            !s.categorySlug?.toLowerCase().includes('pest')
          );
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
      {/* 1. Master Unique Hero Section with Video Background & 3D Realistic Icons */}
      <UniqueHeroSection services={allServices.length > 0 ? allServices : featuredServices} />

      {/* Service Ticker Strip */}
      <div className="border-y-2 border-[#10231D] bg-[#10231D] text-[#F4EFE6] overflow-hidden py-2.5">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-mono uppercase tracking-widest w-max">
          {[...Array(2)].flatMap((_, k) =>
            ['Office Housekeeping', 'Deep Cleaning', 'Sofa Extraction', 'Kitchen Degreasing', 'Bathroom Descaling', 'Marble Buffing', 'Water Tank Cleaning'].map((t) => (
              <span key={`${k}-${t}`} className="flex items-center gap-8">
                <span>{t}</span>
                <span className="text-[#E9A23B]">✦</span>
              </span>
            ))
          )}
        </div>
      </div>


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
              {categories
                .filter(cat => !cat.slug?.toLowerCase().includes('pest') && !cat.name?.toLowerCase().includes('pest'))
                .map((cat) => (
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
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#10231D] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform border border-[#E2D9C8] p-1.5">
                          {getServiceIcon(cat, 'w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs')}
                        </div>
                        <h3 className="font-display font-bold text-xl text-[#10231D] group-hover:text-[#E9A23B] transition-colors leading-tight">
                          {cat.name}
                        </h3>
                      </div>
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

                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#10231D] flex items-center justify-center shrink-0 shadow-sm border border-[#E2D9C8] p-1.5 group-hover:scale-105 transition-transform">
                        {getServiceIcon(service, 'w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs')}
                      </div>
                      <h3 className="font-display font-bold text-xl text-[#10231D] group-hover:text-[#C2512D] transition-colors leading-snug">
                        {service.title}
                      </h3>
                    </div>

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
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#10231D] text-[11px] font-bold tracking-wider uppercase mb-3 border border-[#E2D9C8] shadow-sm">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#10231D] text-white text-[10px] font-black">G</span>
                <span>5.0 ★ Google &amp; Verified Reviews</span>
              </div>
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
                                <svg className="w-3.5 h-3.5 text-[#E9A23B] fill-[#E9A23B]" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Watch Video Testimonial
                              </span>
                              <LuArrowRight className="w-3.5 h-3.5 text-[#E9A23B]" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Top Bar: Stars & Google/Verified Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 text-[#E9A23B]">
                            {[...Array(test.rating || 5)].map((_, starIdx) => (
                              <LuStar key={starIdx} className="w-4 h-4 fill-[#E9A23B]" />
                            ))}
                          </div>
                          {test.reviewDateLabel && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900">
                              {test.reviewDateLabel}
                            </span>
                          )}
                        </div>
                        {test.source === 'Google Review' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#10231D] bg-white px-2.5 py-0.5 rounded-full border border-[#E2D9C8] shadow-xs">
                            <span className="font-black text-[#4285F4]">G</span>
                            Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10231D] bg-[#ECE5D8] px-2 py-0.5 rounded-full">
                            <LuShieldCheck className="w-3 h-3 text-[#E9A23B]" />
                            Verified
                          </span>
                        )}
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
                          {test.reviewCountLabel || test.role || 'Homeowner'} · <span className="text-[#10231D] font-medium">{test.city}</span>
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
