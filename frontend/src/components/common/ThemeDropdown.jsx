import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

/**
 * Universal Theme-Based Dropdown Selector
 * Replaces unstyled native selects with custom paper/ink/brass menu
 */
export default function ThemeDropdown({
  value,
  options = [], // [{ value, label, sublabel, badge }]
  onChange,
  placeholder = 'Select an option...',
  className = '',
  buttonClassName = '',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-paper-subtle border-paper-deep text-ink-faint'
            : isOpen
            ? 'bg-paper border-brass ring-2 ring-brass/20 text-ink shadow-sm'
            : 'bg-paper-subtle hover:bg-paper border-paper-deep text-ink'
        } ${buttonClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <LuChevronDown
          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brass' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto theme-dropdown-menu p-1"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`theme-dropdown-item rounded-md flex items-center justify-between text-left ${
                    isSelected ? 'bg-lather font-semibold text-ink' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="leading-snug">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-ink-muted mt-0.5">{option.sublabel}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {option.badge && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rust-faint text-rust font-semibold">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <LuCheck className="w-4 h-4 text-ink shrink-0" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
