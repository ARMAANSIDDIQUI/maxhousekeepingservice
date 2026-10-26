import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuPhone, LuCalendar } from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa6';
import { useBooking } from '../../context/BookingContext';

export default function MobileBar() {
  const { items, settings } = useBooking();
  const { pathname } = useLocation();

  // Hide mobile consumer bar on admin & supervisor dashboard
  if (pathname.startsWith('/admin') || pathname.startsWith('/supervisor')) {
    return null;
  }

  const phoneHref = `tel:${(settings?.phone || '9897766002').replace(/[^0-9+]/g, '')}`;
  const whatsappHref = `https://wa.me/${(settings?.whatsappNumber || '9897766002').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello ' + (settings?.brandName || 'Max Housekeeping Service') + ', I would like to book a cleaning service.')}`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F4EFE6]/95 backdrop-blur-md border-t border-[#E2D9C8] p-2.5 px-3 flex items-center justify-between gap-2 shadow-2xl">
      {/* Call Button */}
      <a
        href={phoneHref}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-[#10231D] text-[#10231D] bg-[#ECE5D8] text-xs font-bold transition-transform active:scale-95"
      >
        <LuPhone className="w-4 h-4 text-[#10231D]" />
        <span>Call</span>
      </a>

      {/* WhatsApp Button */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#25D366] text-white text-xs font-bold transition-transform active:scale-95 shadow-sm"
      >
        <FaWhatsapp className="w-4 h-4" />
        <span>WhatsApp</span>
      </a>

      {/* Book Now Primary Button */}
      <Link
        to="/book"
        className="flex-[1.4] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#E9A23B] text-[#10231D] text-xs font-black transition-transform active:scale-95 shadow-md relative"
      >
        <LuCalendar className="w-4 h-4" />
        <span>Book Now</span>
        {items.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#10231D] text-[#F4EFE6] text-[9px] flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </Link>
    </div>
  );
}
