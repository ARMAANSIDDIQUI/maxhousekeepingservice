import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LuPhone,
  LuMapPin,
  LuUser,
  LuLogOut,
  LuChevronDown,
  LuCalendar,
  LuMenu,
  LuX
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { apiRequest } from '../../api';
import { getServiceIcon } from '../../utils/iconHelper';
import Modal from './Modal';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { selectedCity, setSelectedCity, items } = useBooking();
  const [cities, setCities] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize sorted services
  const sortedServices = useMemo(() => {
    return [...servicesList].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [servicesList]);

  // Load cities list dynamically from MongoDB
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await apiRequest('/locations/cities');
        if (res && res.success !== false && res.cities && res.cities.length > 0) {
          setCities(res.cities);
          if (!selectedCity) {
            setSelectedCity(res.cities[0]);
          }
        } else {
          setCities([]);
        }
      } catch {
        setCities([]);
      }
    }
    fetchCities();
  }, []);

  // Dynamically load active services from MongoDB for the Services Dropdown
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await apiRequest('/services');
        if (res && res.success !== false && res.services && res.services.length > 0) {
          setServicesList(res.services);
        } else {
          setServicesList([]);
        }
      } catch {
        setServicesList([]);
      }
    }
    fetchServices();
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsServicesDropdownOpen(false);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#E2D9C8]">
        {/* Top Announcement Bar */}
        <div className="bg-[#10231D] text-[#F4EFE6] px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E9A23B] animate-pulse" />
              <span>Direct Booking Hotline:</span>
              <a href="tel:9897766002" className="font-semibold text-[#E9A23B] hover:underline flex items-center gap-1">
                <LuPhone className="w-3.5 h-3.5" /> 98977 66002
              </a>
              <span className="hidden sm:inline text-[#E2D9C8]/40">|</span>
              <a href="tel:8210523309" className="hidden sm:inline hover:underline text-[#E2D9C8]/80">
                82105 23309
              </a>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-[#E2D9C8]/70">
              <span className="hidden md:inline">Open 7 Days (8:00 AM – 8:00 PM)</span>
              {/* City Quick Selector */}
              <button
                type="button"
                onClick={() => setIsCityModalOpen(true)}
                className="flex items-center gap-1 text-[#E9A23B] hover:text-[#D48E28] font-semibold transition-colors cursor-pointer"
              >
                <LuMapPin className="w-3.5 h-3.5" />
                <span>{selectedCity?.name || 'Moradabad'}</span>
                <LuChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Max House Keeping Service"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="flex flex-col">
              <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[#10231D] leading-none group-hover:text-[#E9A23B] transition-colors">
                Max <span className="text-[#E9A23B]">House</span> Keeping Service
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#6B8077] font-semibold mt-0.5">
                WESTERN UP
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#10231D]">
            <Link
              to="/"
              className={`hover:text-[#E9A23B] transition-colors py-1 ${location.pathname === '/' ? 'text-[#E9A23B] font-bold' : ''}`}
            >
              Home
            </Link>

            {/* Services Dropdown (with all services from MongoDB) */}
            <div
              className="relative"
              onMouseEnter={() => setIsServicesDropdownOpen(true)}
              onMouseLeave={() => setIsServicesDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                className={`flex items-center gap-1 hover:text-[#E9A23B] transition-colors py-1 cursor-pointer ${
                  location.pathname.startsWith('/services') ? 'text-[#E9A23B] font-bold' : ''
                }`}
              >
                <span>Services</span>
                <LuChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesDropdownOpen ? 'rotate-180 text-[#E9A23B]' : ''}`} />
              </button>

              {isServicesDropdownOpen && (
                <div className="absolute left-0 top-full pt-2 z-50 w-72">
                  <div className="bg-[#F4EFE6] border border-[#E2D9C8] rounded-2xl shadow-2xl p-2 animate-fadeIn">
                    <div className="max-h-[380px] overflow-y-auto space-y-1">
                      {sortedServices.length > 0 ? (
                        sortedServices.map((svc) => (
                          <Link
                            key={svc._id || svc.slug}
                            to={`/services/${svc.slug}`}
                            onClick={() => setIsServicesDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#10231D] hover:bg-[#ECE5D8] transition-colors"
                          >
                            <span className="p-1.5 rounded-lg bg-[#ECE5D8] text-[#E9A23B] shrink-0">
                              {getServiceIcon(svc.icon, 'w-4 h-4')}
                            </span>
                            <span className="truncate">{svc.title}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-[#6B8077] text-center">
                          Loading services...
                        </div>
                      )}
                    </div>
                    <div className="pt-2 mt-1 border-t border-[#E2D9C8] px-3 pb-1">
                      <Link
                        to="/services"
                        onClick={() => setIsServicesDropdownOpen(false)}
                        className="text-xs font-bold text-[#E9A23B] hover:text-[#D48E28] flex items-center justify-between transition-colors"
                      >
                        <span>View All Services</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/about"
              className={`hover:text-[#E9A23B] transition-colors py-1 ${location.pathname === '/about' ? 'text-[#E9A23B] font-bold' : ''}`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`hover:text-[#E9A23B] transition-colors py-1 ${location.pathname === '/contact' ? 'text-[#E9A23B] font-bold' : ''}`}
            >
              Contact
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`hover:text-[#E9A23B] transition-colors py-1 ${location.pathname === '/dashboard' ? 'text-[#E9A23B] font-bold' : ''}`}
              >
                Dashboard
              </Link>
            )}

            {user && isAdmin && (
              <Link
                to="/admin"
                className="px-2.5 py-1 rounded-lg bg-[#10231D] text-[#E9A23B] text-xs font-bold hover:bg-[#3D524A] transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Actions: City, Login / Profile, Book Now */}
          <div className="flex items-center gap-3">
            {/* City Selector Pill */}
            <button
              type="button"
              onClick={() => setIsCityModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2D9C8] bg-[#ECE5D8] hover:bg-[#E2D9C8] text-xs font-semibold text-[#10231D] transition-colors cursor-pointer"
            >
              <LuMapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>{selectedCity?.name || 'Moradabad'}</span>
              <LuChevronDown className="w-3 h-3 text-[#6B8077]" />
            </button>

            {/* User Profile or Log In link */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-[#E2D9C8] bg-[#ECE5D8] hover:bg-[#E2D9C8] transition-colors cursor-pointer"
                >
                  <img
                    src={user.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=10231D&textColor=F4EFE6'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-[#10231D] max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <LuChevronDown className="w-3 h-3 text-[#3D524A]" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 theme-dropdown-menu z-50">
                    <div className="px-4 py-2.5 border-b border-[#E2D9C8]/60 text-xs">
                      <p className="font-semibold text-[#10231D]">{user.name}</p>
                      <p className="text-[#6B8077] truncate">{user.email || user.phone}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="theme-dropdown-item text-xs font-semibold text-[#E9A23B]"
                      >
                        Admin Control Panel
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="theme-dropdown-item text-xs font-semibold"
                    >
                      My Dashboard & Bookings
                    </Link>

                    <Link
                      to="/book"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="theme-dropdown-item text-xs"
                    >
                      Active Cart ({items.length})
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="theme-dropdown-item text-xs text-[#C2512D] flex items-center gap-2"
                    >
                      <LuLogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-[#10231D] hover:text-[#E9A23B] transition-colors px-2 py-1"
              >
                Log in
              </Link>
            )}

            {/* Book Now Primary Button */}
            <Link
              to="/book"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#E9A23B] hover:bg-[#D48E28] text-[#10231D] shadow-sm transition-all"
            >
              <LuCalendar className="w-4 h-4" />
              <span>Book now</span>
              {items.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#10231D] text-[#F4EFE6] text-[10px] flex items-center justify-center font-bold">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#10231D] hover:bg-[#ECE5D8]"
            >
              {isMobileMenuOpen ? <LuX className="w-6 h-6" /> : <LuMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#F4EFE6] border-b border-[#E2D9C8] px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#10231D]"
            >
              Home
            </Link>
            <Link
              to="/services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#10231D]"
            >
              Services (View All)
            </Link>
            <div className="pl-3 py-1 space-y-1 border-l-2 border-[#E9A23B]/50">
              {servicesList.slice(0, 6).map((svc) => (
                <Link
                  key={svc._id || svc.slug}
                  to={`/services/${svc.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-xs text-[#3D524A] hover:text-[#10231D]"
                >
                  {getServiceIcon(svc.icon, 'w-3 h-3 text-[#E9A23B]')}
                  <span className="truncate">{svc.title}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#10231D]"
            >
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#10231D]"
            >
              Contact
            </Link>
            <Link
              to="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#10231D]"
            >
              Track Order
            </Link>
            {!user && (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-[#E9A23B]"
              >
                Log in
              </Link>
            )}
          </div>
        )}
      </header>

      {/* City Selector Modal */}
      <Modal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        title="Select Your Service City"
        subtitle="Max Housekeeping operates active crews in Western Uttar Pradesh"
        maxWidth="max-w-md"
      >
        <div className="grid grid-cols-2 gap-2.5 mt-2">
          {cities.map((city) => {
            const isSelected = selectedCity?.slug === city.slug;
            return (
              <button
                key={city.slug || city.name}
                type="button"
                onClick={() => {
                  setSelectedCity(city);
                  setIsCityModalOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#E9A23B] bg-[#ECE5D8] font-bold text-[#10231D] ring-2 ring-[#E9A23B]/30'
                    : 'border-[#E2D9C8] bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D]'
                }`}
              >
                <div>
                  <p className="text-sm">{city.name}</p>
                  <p className="text-[11px] text-[#6B8077]">UP, India</p>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#E9A23B]" />
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
