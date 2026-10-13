import React from 'react';
import { Link } from 'react-router-dom';
import { LuPhone, LuMail, LuMapPin, LuClock, LuShieldCheck } from 'react-icons/lu';

export default function Footer() {
  const cities = [
    'Moradabad', 'Rampur', 'Amroha', 'Gajraula', 'Sambhal', 'Chandausi', 'Noorpur', 'Dhampur', 'Bijnor'
  ];

  return (
    <footer className="bg-[#10231D] text-[#F4EFE6] pt-14 pb-24 md:pb-14 border-t border-[#3D524A]">
      <div className="container mx-auto px-4">
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
              <span>Verified Professional Crews · Commercial Grade Chemicals</span>
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
            <h5 className="font-display font-bold text-base text-[#F4EFE6] mb-4">
              Active Service Coverage
            </h5>
            <p className="text-xs text-[#DDEBE4]/70 mb-3">
              Daily technician deployment across Western Uttar Pradesh:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((city) => (
                <span
                  key={city}
                  className="px-2.5 py-1 rounded bg-[#3D524A]/40 text-xs text-[#DDEBE4] border border-[#3D524A]"
                >
                  {city}
                </span>
              ))}
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
                  <a href="tel:9897766002" className="block font-bold text-[#F4EFE6] hover:text-[#E9A23B]">
                    +91 98977 66002
                  </a>
                  <a href="tel:8210523309" className="text-xs text-[#DDEBE4]/70 hover:text-[#E9A23B]">
                    +91 82105 23309
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <LuMail className="w-4 h-4 text-[#E9A23B] shrink-0" />
                <a href="mailto:contact@maxhousekeepingservice.com" className="hover:text-[#E9A23B] text-xs">
                  contact@maxhousekeepingservice.com
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-xs">
                <LuClock className="w-4 h-4 text-[#E9A23B] shrink-0" />
                <span>Mon – Sun: 8:00 AM – 8:00 PM</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs">
                <LuMapPin className="w-4 h-4 text-[#E9A23B] shrink-0" />
                <span>Moradabad, Uttar Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#DDEBE4]/60 gap-4">
          <p>
            &copy; {new Date().getFullYear()} Max House Keeping Service. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/track" className="hover:text-[#F4EFE6]">Track Order</Link>
            <Link to="/login" className="hover:text-[#F4EFE6]">Login Page</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
