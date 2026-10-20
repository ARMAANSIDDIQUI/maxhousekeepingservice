import React, { useState, useEffect } from 'react';
import { LuArrowUp } from 'react-icons/lu';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 0.8 });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top of page"
      title="Scroll to top"
      className={`fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-40 w-11 h-11 rounded-full bg-[#10231D] text-[#E9A23B] border border-[#E9A23B]/30 shadow-xl shadow-[#10231D]/25 flex items-center justify-center transition-all duration-300 ease-out hover:bg-[#3D524A] hover:border-[#E9A23B] hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E9A23B] focus:ring-offset-2 ${
        isVisible
          ? 'opacity-100 pointer-events-auto scale-100 translate-y-0'
          : 'opacity-0 pointer-events-none scale-75 translate-y-3'
      }`}
    >
      <LuArrowUp className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
