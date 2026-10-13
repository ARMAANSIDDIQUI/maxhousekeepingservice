import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

/**
 * Theme & UI specific Custom Dropdown Component
 * Replaces native OS selects with rounded, themed custom divs
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt._id ?? opt.name ?? opt.slug,
        label: opt.label ?? opt.name ?? opt.title ?? String(opt.value)
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange(optValue);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isOpen
            ? 'border-[#E9A23B] bg-[#F4EFE6] ring-2 ring-[#E9A23B]/30 shadow-sm text-[#10231D]'
            : 'border-[#E2D9C8] bg-[#F4EFE6] hover:bg-[#ECE5D8] hover:border-[#6B8077]/40 text-[#10231D]'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <LuChevronDown
          className={`w-4 h-4 text-[#6B8077] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#E9A23B]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown with Theme Rounded Edges & Glass Shadow */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#F4EFE6] border border-[#E2D9C8] rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto animate-popupFadeIn">
          {normalizedOptions.length > 0 ? (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E9A23B]/15 text-[#E9A23B] font-bold'
                      : 'text-[#10231D] hover:bg-[#ECE5D8] hover:text-[#10231D]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <LuCheck className="w-4 h-4 text-[#E9A23B] shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-[#6B8077]">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
