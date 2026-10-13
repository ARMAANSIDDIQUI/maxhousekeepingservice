import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Global Editorial Loading Curtain
 * Creates an elegant warm yellow/amber wipe transition for route changes and async actions
 * Matching the exact warm saffron / amber aesthetic (#E9A23B)
 */
export default function LoadingCurtain({ isVisible, message = 'MAX HOUSEKEEPING SERVICE' }) {
  const panelTransition = {
    duration: 0.7,
    ease: [0.22, 1, 0.36, 1]
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 pointer-events-none flex overflow-hidden">
          {/* Panel 1 */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={panelTransition}
            className="w-1/3 h-full bg-[#E9A23B] border-r border-[#D48E28]/40"
          />

          {/* Panel 2 (Center) with Logo & Brand Monogram */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ ...panelTransition, delay: 0.04 }}
            className="w-1/3 h-full bg-[#D48E28] flex flex-col items-center justify-center relative px-4 shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-col items-center text-center"
            >
              <img
                src="/logo.png"
                alt="Max Housekeeping Service"
                className="w-16 h-16 object-contain mb-3 drop-shadow-md"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="font-display font-black text-2xl tracking-wider text-[#181511]">
                MAX
              </span>
              <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-[#181511]/80 font-black mt-1">
                HOUSEKEEPING SERVICE
              </span>
            </motion.div>
          </motion.div>

          {/* Panel 3 */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ ...panelTransition, delay: 0.08 }}
            className="w-1/3 h-full bg-[#E9A23B] border-l border-[#D48E28]/40"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
