import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LuChevronLeft,
  LuChevronRight,
  LuMaximize2,
  LuX,
  LuImage
} from 'react-icons/lu';

/**
 * Normalizes service media/images to an array of { url, alt }
 */
export function normalizeServiceImages(rawImages, fallbackTitle = 'Service photo', fallbackCategorySlug = 'home-deep-cleaning') {
  if (!rawImages) {
    return [{ url: `/media/categories/${fallbackCategorySlug}.jpg`, alt: fallbackTitle }];
  }

  const list = [];

  // If rawImages is an array
  if (Array.isArray(rawImages)) {
    rawImages.forEach((img, idx) => {
      if (!img) return;
      if (typeof img === 'string') {
        if (!list.some(i => i.url === img)) {
          list.push({ url: img, alt: `${fallbackTitle} photo ${idx + 1}` });
        }
      } else if (img.url && !list.some(i => i.url === img.url)) {
        list.push({ url: img.url, alt: img.alt || `${fallbackTitle} photo ${idx + 1}` });
      }
    });
  } else if (typeof rawImages === 'object') {
    // If passed a full service object
    if (Array.isArray(rawImages.images) && rawImages.images.length > 0) {
      return normalizeServiceImages(rawImages.images, rawImages.title || fallbackTitle, rawImages.categorySlug);
    }
    if (rawImages.media?.hero?.url) {
      list.push({ url: rawImages.media.hero.url, alt: rawImages.media.hero.alt || rawImages.title || fallbackTitle });
    }
    if (Array.isArray(rawImages.media?.gallery)) {
      rawImages.media.gallery.forEach((g, idx) => {
        if (g?.url && !list.some(i => i.url === g.url)) {
          list.push({ url: g.url, alt: g.alt || `${rawImages.title || fallbackTitle} photo ${idx + 2}` });
        }
      });
    }
  } else if (typeof rawImages === 'string') {
    list.push({ url: rawImages, alt: fallbackTitle });
  }

  if (list.length === 0) {
    list.push({ url: `/media/categories/${fallbackCategorySlug}.jpg`, alt: fallbackTitle });
  }

  return list;
}

/**
 * Reusable Interactive Service Image Carousel
 * Supports 'detail' (high-res hero with thumbnail strip & lightbox) and 'card' (compact card preview)
 */
export default function ServiceCarousel({
  images,
  service,
  title = 'Cleaning Service',
  categorySlug = 'home-deep-cleaning',
  mode = 'detail', // 'detail' | 'card'
  className = '',
  aspectRatio,
  autoPlay = false,
  autoPlayInterval = 4000
}) {
  const imageList = React.useMemo(() => {
    if (images) return normalizeServiceImages(images, title, categorySlug);
    if (service) return normalizeServiceImages(service, service.title, service.categorySlug);
    return normalizeServiceImages(null, title, categorySlug);
  }, [images, service, title, categorySlug]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const timerRef = useRef(null);

  // Keep index in range if imageList changes
  useEffect(() => {
    if (currentIndex >= imageList.length) {
      setCurrentIndex(0);
    }
  }, [imageList.length, currentIndex]);

  const nextImage = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  }, [imageList.length]);

  const prevImage = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  }, [imageList.length]);

  const selectImage = useCallback((index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(index);
  }, []);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe && imageList.length > 1) {
      nextImage(e);
    }
    if (isRightSwipe && imageList.length > 1) {
      prevImage(e);
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || imageList.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, autoPlayInterval, imageList.length]);

  const currentImg = imageList[currentIndex] || imageList[0];
  const hasMultiple = imageList.length > 1;

  // --------------------------------------------------------------------------
  // CARD MODE (Compact for Service Cards in Directory & Admin)
  // --------------------------------------------------------------------------
  if (mode === 'card') {
    const cardHeight = aspectRatio || 'h-48';

    return (
      <div
        className={`relative ${cardHeight} w-full overflow-hidden select-none bg-[#ECE5D8] group/carousel ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImg.url}
          alt={currentImg.alt || title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = '/media/site/hero-clean-home.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10231D]/80 via-transparent to-black/20 pointer-events-none" />

        {/* Multiple Photo Badge */}
        {hasMultiple && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10231D]/80 text-[#F4EFE6] backdrop-blur-md text-[10px] font-mono font-bold shadow-xs border border-white/10">
            <LuImage className="w-3 h-3 text-[#E9A23B]" />
            <span>{currentIndex + 1}/{imageList.length}</span>
          </div>
        )}

        {/* Next / Prev Controls (Shown on hover or always accessible) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#10231D]/80 hover:bg-[#10231D] text-[#F4EFE6] hover:text-[#E9A23B] flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 shadow-md backdrop-blur-xs cursor-pointer active:scale-95 border border-white/10"
            >
              <LuChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#10231D]/80 hover:bg-[#10231D] text-[#F4EFE6] hover:text-[#E9A23B] flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 shadow-md backdrop-blur-xs cursor-pointer active:scale-95 border border-white/10"
            >
              <LuChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Indicator Dots */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
            {imageList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => selectImage(idx, e)}
                aria-label={`Go to photo ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-4 h-1.5 bg-[#E9A23B]'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DETAIL MODE (Full high-res slider with thumbnails and lightbox for detail page)
  // --------------------------------------------------------------------------
  const heroHeight = aspectRatio || 'h-80 sm:h-96 md:h-[420px]';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Large Hero Slide */}
      <div
        className={`relative ${heroHeight} w-full rounded-2xl overflow-hidden border-2 border-[#10231D] shadow-xl bg-[#ECE5D8] group/detail select-none`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImg.url}
          alt={currentImg.alt || title}
          className="w-full h-full object-cover transition-all duration-300"
          onError={(e) => {
            e.currentTarget.src = '/media/site/hero-clean-home.jpg';
          }}
        />

        {/* Top Badges: Photo Counter + Zoom Lightbox */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
          {hasMultiple ? (
            <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10231D]/85 text-[#F4EFE6] backdrop-blur-md text-xs font-mono font-bold shadow-md border border-white/10">
              <LuImage className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Photo {currentIndex + 1} of {imageList.length}</span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            aria-label="View fullscreen photo"
            className="pointer-events-auto w-9 h-9 rounded-xl bg-[#10231D]/80 hover:bg-[#10231D] text-[#F4EFE6] hover:text-[#E9A23B] flex items-center justify-center transition-all shadow-md backdrop-blur-md cursor-pointer border border-white/10"
            title="Open Fullscreen View"
          >
            <LuMaximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Previous / Next Chevron Buttons */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-[#10231D]/80 hover:bg-[#10231D] text-[#F4EFE6] hover:text-[#E9A23B] flex items-center justify-center transition-all shadow-lg backdrop-blur-md cursor-pointer active:scale-95 border border-white/10"
            >
              <LuChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-[#10231D]/80 hover:bg-[#10231D] text-[#F4EFE6] hover:text-[#E9A23B] flex items-center justify-center transition-all shadow-lg backdrop-blur-md cursor-pointer active:scale-95 border border-white/10"
            >
              <LuChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Bottom Progress Indicator Dots */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-[#10231D]/80 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
            {imageList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => selectImage(idx, e)}
                aria-label={`Go to photo ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-5 h-2 bg-[#E9A23B]'
                    : 'w-2 h-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation Strip */}
      {hasMultiple && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {imageList.map((img, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => selectImage(idx, e)}
                className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#E9A23B] ring-2 ring-[#E9A23B]/40 scale-102 shadow-md'
                    : 'border-[#E2D9C8] hover:border-[#10231D]/50 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/media/site/hero-clean-home.jpg';
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#E9A23B]/10 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen view"
            className="absolute top-5 right-5 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <LuX className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-5 left-5 z-50 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-mono font-bold backdrop-blur-md">
            {currentIndex + 1} / {imageList.length} · {title}
          </div>

          {/* Main Fullscreen Image Container */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImg.url}
              alt={currentImg.alt || title}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Lightbox Prev / Next buttons */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#E9A23B] hover:text-[#10231D] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <LuChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#E9A23B] hover:text-[#10231D] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <LuChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
