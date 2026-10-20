import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { LuSearch, LuFilter, LuCheck, LuArrowRight, LuCalendar } from 'react-icons/lu';
import { apiRequest } from '../api';
import { useBooking } from '../context/BookingContext';
import CustomSelect from '../components/common/CustomSelect';

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

  const { addItem } = useBooking();

  useEffect(() => {
    async function loadData() {
      try {
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

  const filteredServices = React.useMemo(() => {
    return services
      .filter(s => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.categoryName?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [services, search, sortBy]);

  return (
    <div className="bg-[#F4EFE6] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9A23B]">
            CURATED PROFESSIONAL DIRECTORY
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-[#10231D] tracking-tight mt-1 mb-3">
            All Cleaning Services
          </h1>
          <p className="text-sm text-[#3D524A]">
            Transparent dual pricing with zero hidden charges. Industrial machine scrubbers and eco-certified chemicals.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[#ECE5D8] p-4 sm:p-5 rounded-2xl border border-[#E2D9C8] mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8077]" />
              <input
                type="text"
                placeholder="Search sofa, kitchen, 2 BHK, bathroom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] text-sm text-[#10231D] focus:border-[#E9A23B] focus:outline-none"
              />
            </div>

            {/* Sort Selector */}
            <div className="w-full sm:w-auto flex items-center gap-2 justify-end min-w-[200px]">
              <span className="text-xs font-semibold text-[#3D524A] shrink-0">Sort by:</span>
              <div className="w-44">
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#E2D9C8]/70">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-[#10231D] text-[#F4EFE6]'
                  : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8]'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSearchParams({ category: c.slug })}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === c.slug
                    ? 'bg-[#10231D] text-[#F4EFE6]'
                    : 'bg-[#F4EFE6] text-[#10231D] hover:bg-[#E2D9C8]'
                }`}
              >
                {c.name}
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
          <div className="py-20 text-center">
            <p className="font-display font-bold text-xl text-[#10231D]">No services found</p>
            <p className="text-xs text-[#6B8077] mt-1">Try searching for a different keyword or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => {
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
                  className="group rounded-2xl border border-[#E2D9C8] hover:border-[#E9A23B] bg-[#ECE5D8]/70 hover:bg-[#ECE5D8] overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#E9A23B]/60"
                >
                  {/* Photo Banner */}
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={service.media?.hero?.url || `/media/categories/${service.categorySlug || 'home-deep-cleaning'}.jpg`}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      onError={(e) => { e.currentTarget.src = '/media/site/hero-clean-home.jpg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10231D]/80 via-[#10231D]/20 to-transparent" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {discountPct > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F9ECE8] text-[#C2512D] text-xs font-black shadow-xs">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-mono font-semibold">
                      <span>{service.categoryName} · {service.duration || '1 hr'}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 text-[#E9A23B] font-bold text-[11px]">
                        Details <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#10231D] group-hover:text-[#C2512D] transition-colors mb-2 leading-snug">
                        {service.title}
                      </h3>
                      <p className="text-xs text-[#3D524A] leading-relaxed line-clamp-2 mb-4">
                        {service.shortDescription || service.description}
                      </p>

                      {/* Pricing Box */}
                      <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2D9C8] group-hover:border-[#E9A23B]/40 mb-4 transition-colors">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-display font-black text-2xl text-[#10231D] tnum">
                            ₹{service.price.toLocaleString('en-IN')}
                          </span>
                          {service.mrp > service.price && (
                            <span className="text-sm text-[#6B8077] line-through tnum">
                              ₹{service.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {savings > 0 && (
                          <p className="text-[11px] text-[#C2512D] font-bold mt-1">
                            Save ₹{savings.toLocaleString('en-IN')} ({discountPct}% discount)
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
                          addItem(service, {}, 1);
                        }}
                        className="w-full py-3 rounded-xl bg-[#E9A23B] hover:bg-[#D48E28] active:scale-[0.98] text-[#10231D] font-black text-xs transition-all shadow-sm hover:shadow-md text-center flex items-center justify-center gap-2"
                      >
                        <span>Add to Booking</span>
                        <LuArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
