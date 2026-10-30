import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { LuSearch, LuFilter, LuCheck, LuArrowRight, LuCalendar, LuMapPin, LuRotateCcw } from 'react-icons/lu';
import { FaInstagram } from 'react-icons/fa6';
import { apiRequest } from '../api';
import { useBooking } from '../context/BookingContext';
import CustomSelect from '../components/common/CustomSelect';
import { getServiceIcon } from '../utils/iconHelper';
import ServiceCarousel from '../components/common/ServiceCarousel';
import SEO from '../components/common/SEO';

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategory = searchParams.get('category') || '';
  const categoryAliases = {
    'kitchen-deep-cleaning': 'kitchen-cleaning',
    'bathroom-deep-cleaning': 'bathroom-cleaning',
    'full-home-deep-cleaning': 'home-deep-cleaning',
    'sofa-cleaning': 'sofa-carpet-cleaning',
    'carpet-cleaning': 'sofa-carpet-cleaning'
  };
  const selectedCategory = categoryAliases[rawCategory] || rawCategory;
  
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [loading, setLoading] = useState(false);

  const { addItem, selectedCity, setSelectedCity, cities: contextCities, settings } = useBooking();
  const [citiesList, setCitiesList] = useState(contextCities || []);

  // Fetch cities if not yet loaded in context
  useEffect(() => {
    if (contextCities && contextCities.length > 0) {
      setCitiesList(contextCities);
      return;
    }
    async function fetchCities() {
      try {
        const res = await apiRequest('/locations/cities');
        if (res && res.cities && res.cities.length > 0) {
          setCitiesList(res.cities);
        }
      } catch (err) {
        console.warn('Failed to load cities in ServicesPage:', err);
      }
    }
    fetchCities();
  }, [contextCities]);

  // Read city from searchParams or selectedCity or default 'all'
  const urlCity = searchParams.get('city');
  const activeCitySlug = (urlCity || selectedCity?.slug || 'all').toLowerCase();

  const handleCityChange = (citySlug) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!citySlug || citySlug === 'all') {
      nextParams.delete('city');
    } else {
      nextParams.set('city', citySlug);
      const matched = citiesList.find(c => (c.slug || c.name.toLowerCase()).trim() === citySlug);
      if (matched) {
        setSelectedCity(matched);
      }
    }
    setSearchParams(nextParams);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catsRes, srvsRes] = await Promise.allSettled([
          apiRequest('/categories'),
          apiRequest(`/services${selectedCategory ? `?category=${selectedCategory}` : ''}`)
        ]);

        if (catsRes.status === 'fulfilled' && catsRes.value?.categories && catsRes.value.categories.length > 0) {
          setCategories(catsRes.value.categories);
        } else {
          setCategories([]);
        }
        if (srvsRes.status === 'fulfilled' && srvsRes.value?.services && srvsRes.value.services.length > 0) {
          setServices(srvsRes.value.services);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.warn('Failed to load services from MongoDB:', err);
        setCategories([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory]);

  // Check if a service is available in the currently selected city
  const isAvailableInCity = (s, citySlug) => {
    if (!citySlug || citySlug === 'all' || citySlug === 'moradabad') {
      return true;
    }
    // Moradabad-only services are strictly excluded from other cities
    if (s.moradabadOnly === true) {
      return false;
    }
    const allowed = Array.isArray(s.cityAvailability) && s.cityAvailability.length > 0
      ? s.cityAvailability.map(c => (typeof c === 'string' ? c : c?.slug || '').toLowerCase())
      : ['moradabad'];

    if (allowed.includes(citySlug)) {
      return true;
    }
    // Check if cityRates has an explicit entry
    if (s.hasCitySpecificRates && Array.isArray(s.cityRates)) {
      if (s.cityRates.some(cr => (cr.citySlug || '').toLowerCase() === citySlug)) return true;
    }
    if (Array.isArray(s.matrix) && s.matrix.some(r => Array.isArray(r.cityRates) && r.cityRates.some(cr => (cr.citySlug || '').toLowerCase() === citySlug))) {
      return true;
    }
    // Doorstep mobile van specialized cleaning keywords
    const titleLow = (s.title || '').toLowerCase();
    const slugLow = (s.slug || '').toLowerCase();
    return (
      slugLow.includes('sofa') || slugLow.includes('carpet') || slugLow.includes('chair') ||
      slugLow.includes('pool') || slugLow.includes('swimming') ||
      titleLow.includes('sofa') || titleLow.includes('carpet') || titleLow.includes('chair') ||
      titleLow.includes('pool') || titleLow.includes('swimming')
    );
  };

  // Helper to calculate exact city-dependent rate & unit label
  const getServiceDisplayPricing = (service, citySlug) => {
    if (service.pricingType === 'unit') {
      const isMbd = !citySlug || citySlug === 'moradabad' || citySlug === 'all';
      let rate = isMbd ? (service.unitRateMoradabad ?? service.price) : (service.unitRateOther ?? service.price);
      if (!isMbd && Array.isArray(service.cityRates) && service.cityRates.length > 0) {
        const matched = service.cityRates.find(cr => (cr.citySlug || '').toLowerCase() === citySlug);
        if (matched && typeof matched.rate === 'number') {
          rate = matched.rate;
        }
      }
      const unit = service.unitLabel || (service.pricingUnit === 'litre' ? 'Litre' : 'Sq. Ft.');
      const mrp = service.mrp || 0;
      const savings = mrp > rate ? mrp - rate : 0;
      const discountPct = mrp > rate ? Math.round(((mrp - rate) / mrp) * 100) : 0;
      return {
        isUnit: true,
        price: rate,
        mrp,
        unitLabel: unit,
        savings,
        discountPct,
        displayPrice: `₹${rate}`,
        displayUnit: `/${unit}`
      };
    }

    let price = service.price || 0;
    let mrp = service.mrp || 0;
    if (citySlug && citySlug !== 'moradabad' && citySlug !== 'all') {
      let matchedVariantCity = false;
      if (Array.isArray(service.matrix) && service.matrix.length > 0) {
        const optGroup = service.optionGroups?.[0];
        const groupKey = optGroup?.key || 'size';
        const defaultOpt = optGroup?.options?.find(o => o.isDefault) || optGroup?.options?.[0];
        const defaultRow = (defaultOpt && service.matrix.find(r => {
          const sel = r.selection instanceof Map ? Object.fromEntries(r.selection) : (r.selection || {});
          return String(sel[groupKey] || Object.values(sel)[0] || '').toLowerCase() === String(defaultOpt.key).toLowerCase();
        })) || service.matrix[0];
        if (defaultRow && Array.isArray(defaultRow.cityRates)) {
          const rowMatch = defaultRow.cityRates.find(cr => (cr.citySlug || '').toLowerCase() === citySlug);
          if (rowMatch && typeof rowMatch.rate === 'number' && rowMatch.rate > 0) {
            price = rowMatch.rate;
            if (rowMatch.mrp && rowMatch.mrp > 0) mrp = rowMatch.mrp;
            matchedVariantCity = true;
          }
        }
      }
      if (!matchedVariantCity && service.hasCitySpecificRates && Array.isArray(service.cityRates) && service.cityRates.length > 0) {
        const match = service.cityRates.find(cr => (cr.citySlug || '').toLowerCase() === citySlug);
        if (match && typeof match.rate === 'number' && match.rate > 0) {
          price = match.rate;
          if (match.mrp && match.mrp > 0) mrp = match.mrp;
        }
      } else if (!matchedVariantCity && Array.isArray(service.cityOverrides)) {
        const override = service.cityOverrides.find(o => (o.citySlug || '').toLowerCase() === citySlug && o.isActive !== false);
        if (override) {
          if (override.priceOverride) price = override.priceOverride;
          if (override.mrpOverride) mrp = override.mrpOverride;
          else if (override.multiplier) {
            price = Math.round(price * override.multiplier);
          }
        }
      }
    }
    const savings = mrp > price ? mrp - price : 0;
    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    return {
      isUnit: false,
      price,
      mrp,
      unitLabel: null,
      savings,
      discountPct,
      displayPrice: `₹${price.toLocaleString('en-IN')}`,
      displayUnit: ''
    };
  };

  const filteredServices = useMemo(() => {
    return services
      .filter(s => {
        // 1. City / Location filter
        if (!isAvailableInCity(s, activeCitySlug)) {
          return false;
        }

        // 2. Search query filter
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.shortDescription?.toLowerCase().includes(q) ||
          s.categoryName?.toLowerCase().includes(q) ||
          (Array.isArray(s.tags) && s.tags.some(t => t.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        const pricingA = getServiceDisplayPricing(a, activeCitySlug).price;
        const pricingB = getServiceDisplayPricing(b, activeCitySlug).price;
        if (sortBy === 'price-low') return pricingA - pricingB;
        if (sortBy === 'price-high') return pricingB - pricingA;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [services, search, sortBy, activeCitySlug]);

  // Determine current active city object for labeling
  const activeCityObj = useMemo(() => {
    if (!activeCitySlug || activeCitySlug === 'all') return null;
    return citiesList.find(c => (c.slug || c.name.toLowerCase()).trim() === activeCitySlug) || { name: activeCitySlug, slug: activeCitySlug };
  }, [activeCitySlug, citiesList]);

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <SEO
        title="All Cleaning Services"
        description="Browse all professional home and commercial cleaning services by Max Housekeeping Service in Moradabad, Rampur, Sambhal, and Western UP."
      />
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
            OUR CLEANING SERVICES
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-[#10231D] tracking-tight mt-1 mb-3">
            All Cleaning Services
          </h1>
          <p className="text-sm text-[#3D524A]">
            Clear, honest prices with no hidden charges. Modern cleaning machines and safe, child-friendly products.
          </p>
        </div>

        {/* Location Notice Banner */}
        {activeCityObj && activeCitySlug !== 'all' && (
          <div className="mb-6 p-4 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#E9A23B]/20 text-[#B87013] shrink-0">
                <LuMapPin className="w-5 h-5 text-[#B87013]" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#10231D]">
                  Location: <span className="text-[#C2512D]">{activeCityObj.name}</span>
                </p>
                <p className="text-[11px] text-[#3D524A] mt-0.5">
                  {activeCitySlug === 'moradabad'
                    ? 'All 25+ home, commercial, kitchen, water tank, and deep cleaning services are available in Moradabad.'
                    : `Specialized doorstep sofa dry cleaning, carpet deep cleaning (₹30/sq ft), chair dry cleaning, floor scrubbing, and swimming pool cleaning (₹0.10/L) are available in ${activeCityObj.name}.`}
                </p>
              </div>
            </div>
            {activeCitySlug !== 'moradabad' && (
              <button
                type="button"
                onClick={() => handleCityChange('moradabad')}
                className="px-3.5 py-1.5 rounded-xl bg-[#10231D] hover:bg-[#1C3B31] text-[#F4EFE6] text-xs font-bold whitespace-nowrap transition-colors shrink-0"
              >
                Switch to Moradabad
              </button>
            )}
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-[#ECE5D8] p-4 sm:p-5 rounded-2xl border border-[#E2D9C8] mb-10 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
              <input
                type="text"
                placeholder="Search sofa, carpet, swimming pool, kitchen, 2 BHK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none placeholder:text-[#6B8077]/70"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-semibold text-[#3D524A] shrink-0">Sort:</span>
              <div className="w-40">
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={[
                    { value: 'recommended', label: 'Recommended' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' }
                  ]}
                  placeholder="Sort by..."
                />
              </div>
            </div>
          </div>

          {/* Quick Location Filter Pills */}
          <div className="pt-2 border-t border-[#E2D9C8]/70">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[11px] font-mono font-bold uppercase text-[#6B8077] shrink-0 flex items-center gap-1 mr-1">
                <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" /> Location:
              </span>
              <button
                type="button"
                onClick={() => handleCityChange('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  activeCitySlug === 'all'
                    ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                    : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8]'
                }`}
              >
                All Locations
              </button>
              {citiesList.map((c) => {
                const slug = (c.slug || c.name.toLowerCase()).trim();
                const isSelected = activeCitySlug === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => handleCityChange(slug)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-[#10231D] text-[#F4EFE6] shadow-xs'
                        : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#E2D9C8]/70">
            <span className="text-[11px] font-mono font-bold uppercase text-[#6B8077] shrink-0 mr-1">
              Category:
            </span>
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('category');
                setSearchParams(next);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-[#E9A23B] text-[#10231D] shadow-xs'
                  : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8]'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('category', c.slug);
                  setSearchParams(next);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === c.slug
                    ? 'bg-[#E9A23B] text-[#10231D] shadow-xs'
                    : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8]'
                }`}
              >
                <span className={selectedCategory === c.slug ? 'text-[#10231D]' : 'text-[#6B8077]'}>
                  {getServiceIcon(c.iconKey || c.slug, 'w-3.5 h-3.5')}
                </span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-[#6B8077]">
            LOADING CATALOG PACKAGES...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-20 text-center bg-[#ECE5D8]/50 rounded-2xl border border-[#E2D9C8] p-8 max-w-xl mx-auto">
            <LuMapPin className="w-10 h-10 text-[#6B8077] mx-auto mb-3" />
            <p className="font-display font-bold text-xl text-[#10231D]">No services found</p>
            <p className="text-xs text-[#6B8077] mt-1">
              {activeCityObj
                ? `No cleaning services found matching your criteria in ${activeCityObj.name}.`
                : 'Try searching for a different keyword or category.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {activeCitySlug !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleCityChange('all')}
                  className="px-4 py-2 rounded-xl bg-[#10231D] text-[#F4EFE6] text-xs font-bold hover:bg-[#1C3B31] transition-colors"
                >
                  View All Locations
                </button>
              )}
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="px-4 py-2 rounded-xl bg-[#F4EFE6] text-[#10231D] border border-[#E2D9C8] text-xs font-bold hover:bg-[#E2D9C8] transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => {
              const pricing = getServiceDisplayPricing(service, activeCitySlug);

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
                  className="group rounded-2xl border border-[#E2D9C8] hover:border-[#E9A23B] bg-[#ECE5D8]/70 hover:bg-[#ECE5D8] overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#E9A23B]/60"
                >
                  {/* Photo Banner with Interactive Carousel */}
                  <div className="h-48 overflow-hidden relative">
                    <ServiceCarousel
                      service={service}
                      title={service.title}
                      mode="card"
                      aspectRatio="h-48"
                      categorySlug={service.categorySlug}
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 pointer-events-none">
                      {pricing.discountPct > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-black shadow-xs">
                          {pricing.discountPct}% OFF
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                      {service.moradabadOnly ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#10231D]/80 text-[#F4EFE6] text-[10px] font-bold backdrop-blur-xs shadow-xs">
                          Moradabad Only
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#1D6043]/90 text-white text-[10px] font-bold backdrop-blur-xs shadow-xs">
                          All Cities Available
                        </span>
                      )}
                      {pricing.isUnit && (
                        <span className="px-2 py-0.5 rounded-md bg-[#E9A23B] text-[#10231D] text-[10px] font-black shadow-xs">
                          Per {pricing.unitLabel}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-mono font-semibold z-10 pointer-events-none">
                      <span>{service.categoryName || 'Cleaning'} · {service.duration || '1 hr'}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 text-[#E9A23B] font-bold text-[11px]">
                        Details <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#10231D] group-hover:text-[#C2512D] transition-colors mb-2 leading-snug flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-[#ECE5D8] text-[#E9A23B] shrink-0 inline-flex">
                          {getServiceIcon(service.icon, 'w-4 h-4')}
                        </span>
                        <span className="truncate">{service.title}</span>
                      </h3>
                      <p className="text-xs text-[#3D524A] leading-relaxed line-clamp-2 mb-4">
                        {service.shortDescription || service.description}
                      </p>

                      {/* Pricing Box */}
                      <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] group-hover:border-[#E9A23B]/40 mb-4 transition-colors">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-black text-2xl text-[#10231D] tnum">
                            {pricing.displayPrice}
                          </span>
                          {pricing.displayUnit && (
                            <span className="text-xs font-bold text-[#6B8077] uppercase tracking-wide">
                              {pricing.displayUnit}
                            </span>
                          )}
                          {pricing.mrp > pricing.price && (
                            <span className="text-sm text-[#6B8077] line-through tnum ml-auto">
                              ₹{pricing.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {pricing.savings > 0 && (
                          <p className="text-[11px] text-[#C2512D] font-bold mt-1">
                            Save ₹{pricing.savings.toLocaleString('en-IN')} ({pricing.discountPct}% discount)
                          </p>
                        )}
                        {pricing.isUnit && (
                          <p className="text-[10px] text-[#6B8077] font-medium mt-1">
                            Dynamic calculation based on exact {pricing.unitLabel} required.
                          </p>
                        )}
                      </div>

                      {/* Inclusions */}
                      {service.inclusions && service.inclusions.length > 0 && (
                        <ul className="space-y-1.5 text-xs text-[#3D524A] mb-5">
                          {service.inclusions.slice(0, 3).map((inc, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <LuCheck className="w-3.5 h-3.5 text-[#10231D] shrink-0" />
                              <span className="truncate">{inc}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#E2D9C8]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (service.pricingType === 'unit') {
                            const cParam = activeCitySlug !== 'all' ? `&city=${activeCitySlug}` : '';
                            navigate(`/book?service=${service.slug}${cParam}`);
                          } else {
                            addItem(service, {}, 1);
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] active:scale-[0.98] text-[#10231D] font-black text-xs transition-all shadow-sm hover:shadow-md text-center flex items-center justify-center gap-2"
                      >
                        <span>{service.pricingType === 'unit' ? 'Configure & Book' : 'Add to Booking'}</span>
                        <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instagram Reel Consultation Banner */}
        <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-[#10231D] text-[#F4EFE6] border border-[#2C4A3E] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center shrink-0 shadow-lg">
              <FaInstagram className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E9A23B] bg-[#1C3A30] px-2.5 py-0.5 rounded-full">
                Video Demos & Reels
              </span>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#F4EFE6] mt-1">
                See Our Cleaning Results Before You Book
              </h3>
              <p className="text-xs sm:text-sm text-[#A3B8B0] mt-0.5">
                Watch unfiltered before/after videos and equipment walk-throughs on our official Instagram channel.
              </p>
            </div>
          </div>
          <a
            href={settings?.instagramUrl || "https://www.instagram.com/maxhousekeepingservice/"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-bold text-sm text-center shrink-0 shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <FaInstagram className="w-4 h-4" />
            <span>@maxhousekeepingservice</span>
          </a>
        </div>
      </div>
    </div>
  );
}
