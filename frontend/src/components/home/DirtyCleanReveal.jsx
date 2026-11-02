import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Draggable "Before / After" reveal built from a single photo.
 * Left = grimy (CSS filters + grime overlay), Right = spotless original.
 * Auto-sweeps once on load to hint at interactivity.
 */
export default function DirtyCleanReveal({
  src = '/media/site/hero-clean-home.jpg',
  className = ''
}) {
  const boxRef = useRef(null);
  const [pos, setPos] = useState(8);
  const [dragging, setDragging] = useState(false);
  const touchedRef = useRef(false);

  const updateFromX = useCallback((clientX) => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(97, Math.max(3, pct)));
  }, []);

  // Intro sweep so users notice it is draggable
  useEffect(() => {
    let raf;
    let start;
    const run = (t) => {
      if (touchedRef.current) return;
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 1800);
      const eased = 1 - Math.pow(1 - p, 3);
      setPos(8 + eased * 52);
      if (p < 1) raf = requestAnimationFrame(run);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(run); }, 500);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, []);

  const onDown = (e) => {
    touchedRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateFromX(e.clientX);
  };
  const onMove = (e) => { if (dragging) updateFromX(e.clientX); };
  const onUp = () => setDragging(false);

  const onKey = (e) => {
    touchedRef.current = true;
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(3, p - 4));
    if (e.key === 'ArrowRight') setPos((p) => Math.min(97, p + 4));
  };

  return (
    <div
      ref={boxRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`relative select-none touch-pan-y overflow-hidden rounded-[2rem] border-2 border-[#10231D] shadow-[10px_10px_0_0_#10231D] cursor-ew-resize bg-[#10231D] ${className}`}
    >
      {/* AFTER (clean, base layer) */}
      <img
        src={src}
        alt="Spotless home after professional cleaning"
        draggable={false}
        className="block w-full h-full object-cover"
      />

      {/* BEFORE (grimy layer, clipped to the left of the handle) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={src}
          alt="Dusty home before cleaning"
          draggable={false}
          className="w-full h-full object-cover"
          style={{ filter: 'sepia(0.85) saturate(0.7) brightness(0.62) contrast(1.15) blur(0.4px)' }}
        />
        {/* grime speckle */}
        <div
          className="absolute inset-0 mix-blend-multiply opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(60,40,15,.55) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(60,40,15,.5) 0 2px, transparent 3px), radial-gradient(circle at 45% 80%, rgba(40,28,10,.5) 0 3px, transparent 4px), radial-gradient(circle at 85% 20%, rgba(60,40,15,.45) 0 2px, transparent 3px)',
            backgroundSize: '90px 90px, 130px 130px, 160px 160px, 110px 110px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5a3d12]/40 via-transparent to-[#1b1206]/50" />
      </div>

      {/* Labels */}
      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#1b1206]/85 text-[#F4EFE6] text-[11px] font-mono font-bold uppercase tracking-widest">
        Before
      </span>
      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#E9A23B] text-[#10231D] text-[11px] font-mono font-bold uppercase tracking-widest">
        After
      </span>

      {/* Handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Reveal before and after cleaning"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKey}
        className="absolute top-0 bottom-0 w-0.5 bg-[#F4EFE6] focus:outline-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#E9A23B] border-2 border-[#10231D] shadow-lg flex items-center justify-center text-[#10231D] font-black text-sm">
          ⇆
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#10231D]/80 text-[#F4EFE6] text-[10px] font-mono tracking-wider pointer-events-none">
        Drag to reveal
      </div>
    </div>
  );
}

