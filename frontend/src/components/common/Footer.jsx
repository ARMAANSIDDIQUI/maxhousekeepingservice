import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuPhone, LuMail, LuMapPin, LuClock, LuShieldCheck, LuDownload, LuCheck } from 'react-icons/lu';
import { apiRequest } from '../../api';
import { useBooking } from '../../context/BookingContext';
import { usePWA } from '../../context/PWAContext';

export default function Footer() {
  const { selectedCity, setSelectedCity, cities: contextCities, settings: contextSettings } = useBooking();
  const { isInstalled, promptInstall } = usePWA();
  const [cities, setCities] = useState(Array.isArray(contextCities) ? contextCities : []);

  const settings = contextSettings || {
    brandName: 'Max House Keeping Service',
    phone: '+91 98977 66002',
    alternatePhone: '+91 82105 23309',
    email: 'vikasmax321@gmail.com',
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    address: 'Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001'
  };

  // Dynamic fetch to get live cities if not in context
  useEffect(() => {
    let isMounted = true;
    async function fetchCities() {
      try {
        const res = await apiRequest('/locations/cities');
        if (isMounted && res && res.success !== false && Array.isArray(res.cities)) {
          setCities(res.cities);
          return;
        }
      } catch (err) {
        console.warn('Dynamic cities fetch notice:', err);
      }
      if (isMounted) {
        setCities([]);
      }
    }

    if (Array.isArray(contextCities) && contextCities.length > 0) {
      setCities(contextCities);
    } else {
      fetchCities();
    }

    return () => {
      isMounted = false;
    };
  }, [contextCities]);

  return (
    <footer className="bg-[#10231D] text-[#F4EFE6] pt-14 pb-24 md:pb-14 border-t border-[#3D524A]">
      <div className="container mx-auto px-4">
        {/* If app is not downloaded/installed, show Download / Install App banner */}
        {!isInstalled && (
          <div className="mb-12 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#173228] to-[#10231D] border border-[#E9A23B]/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <img
                src="/icon-192.png"
                alt="Max Housekeeping App Icon"
                className="w-14 h-14 rounded-xl border-2 border-[#E9A23B] shadow-md object-cover bg-[#0A1713] shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base sm:text-lg text-[#F4EFE6]">
                    Get the Max Housekeeping App
                  </span>
                  {/* <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E9A23B]/20 text-[#E9A23B] border border-[#E9A23B]/30">
                    Fast PWA
                  </span> */}
                </div>
                <p className="text-xs text-[#DDEBE4]/80 mt-1 max-w-xl">
                  Install our lightweight app directly to your device home screen for 1-tap bookings, real-time cleaner tracking, and instant updates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={promptInstall}
              id="footer-download-app-btn"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E9A23B] text-[#10231D] font-bold text-sm hover:bg-[#d89330] transition-all shadow-md active:scale-95 group cursor-pointer w-full md:w-auto"
            >
              <LuDownload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              <span>Download / Install App</span>
            </button>
          </div>
        )}

        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#3D524A]/70">
          {/* Col 1: Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Max House Keeping Service"
                className="w-10 h-10 object-contain drop-shadow"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <h4 className="font-display font-black text-lg text-[#F4EFE6] leading-none">
                  MAX HOUSEKEEPING
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-[#E9A23B] mt-0.5">
                  SERVICE · WESTERN UP
                </p>
              </div>
            </div>
            <p className="text-sm text-[#DDEBE4]/80 leading-relaxed mb-4">
              Western Uttar Pradesh's highest-rated professional housekeeping and commercial cleaning service. Mechanised floor scrubbing, sofa shampooing, and bathroom sanitisation.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E9A23B] font-semibold">
              <LuShieldCheck className="w-4 h-4" />
              <span>Verified Professional Crews</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h5 className="font-display font-bold text-base text-[#F4EFE6] mb-4">
              Cleaning Services
            </h5>
            <ul className="space-y-2 text-sm text-[#DDEBE4]/80">
              <li>
                <Link to="/services?category=home-deep-cleaning" className="hover:text-[#E9A23B] transition-colors">
                  Full Home Deep Cleaning
                </Link>
              </li>
              <li>
                <Link to="/services?category=bathroom-cleaning" className="hover:text-[#E9A23B] transition-colors">
                  Bathroom Tile Descaling
                </Link>
              </li>
              <li>
                <Link to="/services?category=kitchen-cleaning" className="hover:text-[#E9A23B] transition-colors">
                  Kitchen Degreasing & Chimney
                </Link>
              </li>
              <li>
                <Link to="/services?category=sofa-carpet-cleaning" className="hover:text-[#E9A23B] transition-colors">
                  Sofa Shampooing & Dry Cleaning
                </Link>
              </li>
              <li>
                <Link to="/services?category=commercial-cleaning" className="hover:text-[#E9A23B] transition-colors">
                  Commercial & Office Housekeeping
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Operational Service Areas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-display font-bold text-base text-[#F4EFE6]">
                Active Service Coverage
              </h5>
              {cities.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E9A23B]/20 text-[#E9A23B] text-[10px] font-mono font-bold border border-[#E9A23B]/30">
                  {cities.length} Cities
                </span>
              )}
            </div>
            <p className="text-xs text-[#DDEBE4]/70 mb-3">
              Daily technician deployment across {cities.length > 0 ? `${cities.length} ` : ''}Western UP cities:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => {
                const cityName = typeof city === 'string' ? city : (city.name || city.slug);
                const citySlug = typeof city === 'string' ? city.toLowerCase() : (city.slug || city.name?.toLowerCase());
                const cityKey = typeof city === 'string' ? city : (city._id || city.slug || city.name);
                const isSelected = selectedCity && (
                  (typeof selectedCity === 'string' && selectedCity.toLowerCase() === citySlug) ||
                  selectedCity.slug === citySlug ||
                  selectedCity.name === cityName
                );

                return (
                  <button
                    key={cityKey}
                    type="button"
                    onClick={() => {
                      const targetCity = typeof city === 'string' ? { name: city, slug: citySlug } : city;
                      setSelectedCity(targetCity);
                    }}
                    title={`Select ${cityName} as your service city`}
                    className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#E9A23B] text-[#10231D] font-bold border-[#E9A23B] shadow-sm ring-1 ring-[#E9A23B]/50'
                        : 'bg-[#3D524A]/40 text-[#DDEBE4] hover:bg-[#3D524A] hover:text-[#F4EFE6] border-[#3D524A]'
                    }`}
                  >
                    {cityName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 4: Contact & Hours */}
          <div>
            <h5 className="font-display font-bold text-base text-[#F4EFE6] mb-4">
              Contact & Bookings
            </h5>
            <ul className="space-y-3 text-sm text-[#DDEBE4]/80">
              <li className="flex items-start gap-2.5">
                <LuPhone className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                <div>
                  <a href={`tel:${(settings.phone || '').replace(/[^0-9+]/g, '')}`} className="block font-bold text-[#F4EFE6] hover:text-[#E9A23B]">
                    {settings.phone}
                  </a>
                  {settings.alternatePhone && (
                    <a href={`tel:${(settings.alternatePhone || '').replace(/[^0-9+]/g, '')}`} className="text-xs text-[#DDEBE4]/70 hover:text-[#E9A23B]">
                      {settings.alternatePhone}
                    </a>
                  )}
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <LuMail className="w-4 h-4 text-[#E9A23B] shrink-0" />
                <a href={`mailto:${settings.email || ''}`} className="hover:text-[#E9A23B] text-xs">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-xs">
                <LuClock className="w-4 h-4 text-[#E9A23B] shrink-0" />
                <span>{settings.workingHours}</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs">
                <LuMapPin className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#DDEBE4]/60 gap-4">
          <p>
            &copy; {new Date().getFullYear()} {settings.brandName || 'Max House Keeping Service'}. All rights reserved.
          </p>
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            {!isInstalled ? (
              <button
                type="button"
                onClick={promptInstall}
                className="hover:text-[#E9A23B] flex items-center gap-1.5 font-medium transition-colors cursor-pointer text-[#E9A23B]/90"
                title="Download / Install Max Housekeeping App"
              >
                <LuDownload className="w-3.5 h-3.5" />
                <span>Download App</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[#E9A23B] font-mono text-[11px]">
                <LuCheck className="w-3.5 h-3.5" />
                <span>App Installed</span>
              </span>
            )}
            <Link to="/track" className="hover:text-[#F4EFE6]">Track Order</Link>
            <Link to="/login" className="hover:text-[#F4EFE6]">Login Page</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
