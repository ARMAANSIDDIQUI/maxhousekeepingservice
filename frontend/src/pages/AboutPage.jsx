import React from 'react';
import { Link } from 'react-router-dom';
import {
  LuShieldCheck,
  LuSparkles,
  LuUsers,
  LuMapPin,
  LuCheck,
  LuPhone,
  LuAward
} from 'react-icons/lu';
import { FaInstagram } from 'react-icons/fa6';
import { useBooking } from '../context/BookingContext';
import SEO from '../components/common/SEO';

export default function AboutPage() {
  const { cities, settings } = useBooking();
  const displayCities = cities && cities.length > 0
    ? cities.map(c => typeof c === 'string' ? c : (c.name || c.slug))
    : ['Moradabad', 'Rampur', 'Amroha', 'Sambhal', 'Chandausi', 'Noorpur', 'Dhampur', 'Bijnor', 'Kanth'];
  return (
    <div className="py-12 md:py-20 bg-[#F4EFE6] text-[#10231D]">
      <SEO
        title="About Max Housekeeping Service"
        description="Learn about Max Housekeeping Service: Western Uttar Pradesh's leading mechanized home cleaning, sofa shampooing, and commercial housekeeping corporation headquartered in Moradabad."
        keywords="about max housekeeping, Moradabad cleaning company, professional cleaners Western UP, mechanized cleaning team, verified cleaners Moradabad"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pb-16 border-b border-[#E2D9C8]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDEBE4] text-[#10231D] text-xs font-bold mb-4">
              <LuAward className="w-4 h-4 text-[#E9A23B]" />
              <span>UTTAR PRADESH'S TRUSTED CLEANING TEAM</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-[#10231D] leading-tight mb-6">
              Making Every Home & Office Clean, Fresh & Healthy.
            </h1>
            <p className="text-base md:text-lg text-[#3D524A] leading-relaxed mb-6 font-sans">
              Started in Moradabad, Max Housekeeping Service was built with a simple goal: to bring hotel-like cleanliness, trusted and verified staff, and safe, child-friendly cleaning products to homes and offices across Uttar Pradesh.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/book"
                className="px-6 py-3.5 rounded-xl bg-[#10231D] hover:bg-[#3D524A] text-[#F4EFE6] font-bold text-sm tracking-wide transition-all shadow-md"
              >
                Book a Cleaning Service
              </Link>
              <a
                href={`tel:${(settings?.phone || '+919897766002').replace(/[^0-9+]/g, '')}`}
                className="px-6 py-3.5 rounded-xl bg-[#ECE5D8] hover:bg-[#E2D9C8] text-[#10231D] font-bold text-sm border border-[#E2D9C8] transition-all flex items-center gap-2"
              >
                <LuPhone className="w-4 h-4 text-[#E9A23B]" />
                <span>Call {settings?.phone || '+91 98977 66002'}</span>
              </a>
              <a
                href={settings?.instagramUrl || "https://www.instagram.com/maxhousekeepingservice/"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2"
              >
                <FaInstagram className="w-4 h-4" />
                <span>@maxhousekeepingservice</span>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden border-2 border-[#10231D] shadow-2xl bg-[#10231D]">
              <img
                src="/hero-clean-home.jpg"
                alt="Max Housekeeping Service Team in Uniform"
                className="w-full h-[400px] object-cover opacity-90"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=75';
                }}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[#F4EFE6] p-5 rounded-2xl border border-[#E2D9C8] shadow-xl max-w-xs">
              <p className="font-display font-bold text-2xl text-[#10231D]">10,000+</p>
              <p className="text-xs font-mono text-[#6B8077] uppercase tracking-wider">
                Homes & Corporate Offices Sanitised
              </p>
            </div>
          </div>
        </div>

        {/* Pillars / Values Grid */}
        <div className="py-16 border-b border-[#E2D9C8]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-display font-black text-[#10231D] mb-3">
              The Max Housekeeping Standard
            </h2>
            <p className="text-sm text-[#3D524A]">
              We do not cut corners. Our staff arrives in our official black & red uniform with personal identification and commercial-grade machines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
              <div className="w-12 h-12 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center mb-6">
                <LuShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#10231D] mb-2">
                100% Verified & Trusted Staff
              </h3>
              <p className="text-xs text-[#3D524A] leading-relaxed">
                Every team member has their ID checked, police verification completed, and full hands-on training before visiting your home.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
              <div className="w-12 h-12 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center mb-6">
                <LuSparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#10231D] mb-2">
                Safe & Child-Friendly Products
              </h3>
              <p className="text-xs text-[#3D524A] leading-relaxed">
                We use trusted Taski & 3M cleaning liquids that remove 99.9% of germs and hard-water stains while staying completely safe for kids and pets.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#ECE5D8] border border-[#E2D9C8]">
              <div className="w-12 h-12 rounded-xl bg-[#10231D] text-[#E9A23B] flex items-center justify-center mb-6">
                <LuUsers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#10231D] mb-2">
                Clear & Honest Pricing
              </h3>
              <p className="text-xs text-[#3D524A] leading-relaxed">
                See the exact price and discount upfront for every service. No hidden charges or surprise fees.
              </p>
            </div>
          </div>
        </div>

        {/* Coverage Towns */}
        <div className="py-16">
          <div className="p-8 md:p-12 rounded-3xl bg-[#10231D] text-[#F4EFE6] relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-[#E9A23B] uppercase tracking-widest mb-3">
                <LuMapPin className="w-4 h-4" />
                <span>Cities We Serve</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
                Serving Moradabad and Nearby Cities in UP
              </h2>
              <p className="text-sm text-[#DDEBE4]/80 leading-relaxed mb-6 font-sans">
                Our cleaning teams travel across Moradabad, Rampur, Amroha, Sambhal, Chandausi, Gajraula, Noorpur, Dhampur, and Bijnor with same-day and scheduled bookings.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {displayCities.map((city) => (
                  <div key={city} className="flex items-center gap-2 text-xs font-bold text-[#F4EFE6]">
                    <LuCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
