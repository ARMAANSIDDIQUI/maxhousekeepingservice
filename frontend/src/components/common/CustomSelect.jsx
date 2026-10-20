import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

/**
 * Accessible Custom Dropdown Component
 * Full WAI-ARIA combobox/listbox pattern with complete keyboard navigation:
 * - ArrowDown / ArrowUp: navigate options & cycle
 * - Enter / Space: open & select
 * - Escape: close & return focus
 * - Home / End: jump to start/end
 * - Type-ahead: jump by first character
 * - Auto-scroll active option into view
 * - Portal-based rendering prevents container overflow clipping
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  size = 'md',
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);
  const uniqueId = useId();
  const listboxId = `listbox-${id || uniqueId}`;

  // Normalize options to [{ value, label, icon }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt._id ?? opt.name ?? opt.slug,
        label: opt.label ?? opt.name ?? opt.title ?? String(opt.value),
        icon: opt.icon || null
      };
    }
    return { value: opt, label: String(opt), icon: null };
  });

  const selectedIndex = normalizedOptions.findIndex(
    (opt) => String(opt.value) === String(value)
  );
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownEstimatedHeight = 220;

    const openUp = spaceBelow < dropdownEstimatedHeight && spaceAbove > spaceBelow;
    const safeWidth = Math.min(Math.max(rect.width, 160), window.innerWidth - 16);
    const safeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - safeWidth - 8));

    setCoords({
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left: safeLeft,
      width: safeWidth,
      openUp
    });
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }, [disabled, selectedIndex, updatePosition]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSelect = useCallback((optValue) => {
    if (onChange) {
      onChange(optValue);
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  // Update position on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [isOpen, highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
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

  // Keyboard navigation handler (WAI-ARIA Combobox)
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < normalizedOptions.length - 1 ? prev + 1 : 0
        );
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : normalizedOptions.length - 1
        );
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          handleSelect(normalizedOptions[highlightedIndex].value);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeDropdown();
        break;
      }
      case 'Home': {
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        setHighlightedIndex(normalizedOptions.length - 1);
        break;
      }
      case 'Tab': {
        setIsOpen(false);
        break;
      }
      default: {
        // Single character type-ahead search
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const char = e.key.toLowerCase();
          const startIdx = highlightedIndex + 1;
          const match =
            normalizedOptions.slice(startIdx).find((opt) => opt.label.toLowerCase().startsWith(char)) ||
            normalizedOptions.slice(0, startIdx).find((opt) => opt.label.toLowerCase().startsWith(char));

          if (match) {
            const matchIndex = normalizedOptions.indexOf(match);
            if (matchIndex >= 0) {
              setHighlightedIndex(matchIndex);
            }
          }
        }
        break;
      }
    }
  };

  return (
    <div className={`relative inline-block w-full text-left select-none ${className}`}>
      {/* Trigger Combobox Button */}
      <button
        id={id}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (isOpen) {
              setIsOpen(false);
            } else {
              openDropdown();
            }
          }
        }}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 border transition-all cursor-pointer ${
          size === 'sm'
            ? 'px-3 py-1.5 rounded-lg text-xs font-semibold'
            : 'px-3.5 py-2.5 rounded-xl text-sm font-medium'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isOpen
            ? 'border-[#E9A23B] bg-[#F4EFE6] ring-2 ring-[#E9A23B]/30 shadow-sm text-[#10231D]'
            : 'border-[#E2D9C8] bg-[#F4EFE6] hover:bg-[#ECE5D8] hover:border-[#6B8077]/40 text-[#10231D]'
        }`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <LuChevronDown
          className={`w-4 h-4 text-[#6B8077] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#E9A23B]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Portal with Fixed Coordinates */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999
          }}
          className="bg-[#F4EFE6] border border-[#E2D9C8] rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto animate-popupFadeIn"
        >
          {normalizedOptions.length > 0 ? (
            normalizedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  id={`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  ref={(el) => { optionRefs.current[idx] = el; }}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E9A23B]/20 text-[#10231D] font-bold'
                      : isHighlighted
                      ? 'bg-[#ECE5D8] text-[#10231D]'
                      : 'text-[#10231D] hover:bg-[#ECE5D8]'
                  } ${isHighlighted ? 'ring-1 ring-[#E9A23B]/50' : ''}`}
                >
                  <span className="truncate flex items-center gap-2.5">
                    {opt.icon && (
                      <span className="shrink-0 flex items-center justify-center">
                        {opt.icon}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
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
        </div>,
        document.body
      )}
    </div>
  );
}
