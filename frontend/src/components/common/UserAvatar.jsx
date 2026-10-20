import React, { useState } from 'react';
import { LuUser } from 'react-icons/lu';

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Universal UserAvatar Component
 * Displays user photo if available; automatically falls back to clean geometrical head & shoulders icon / initials.
 */
export default function UserAvatar({
  user,
  name,
  avatarUrl,
  size = 'md',
  className = '',
  border = true
}) {
  const [imgError, setImgError] = useState(false);

  const displayName = name || user?.name || '';
  const photoUrl = avatarUrl !== undefined ? avatarUrl : user?.avatarUrl;
  const initials = getInitials(displayName);

  // Size variations
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl font-black'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const borderClass = border ? 'border border-[#E2D9C8]' : '';

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={displayName || 'User'}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${currentSizeClass} ${borderClass} ${className}`}
      />
    );
  }

  // Geometrical Head & Shoulders dummy icon / Initials
  return (
    <div
      title={displayName || 'User'}
      aria-label={displayName || 'User'}
      className={`rounded-full shrink-0 flex items-center justify-center font-display font-black tracking-wide bg-[#10231D] text-[#F4EFE6] select-none ${currentSizeClass} ${borderClass} ${className}`}
    >
      {initials ? (
        <span className="leading-none">{initials}</span>
      ) : (
        <LuUser className={`${iconSizes[size] || 'w-4 h-4'} text-[#ECE5D8]`} />
      )}
    </div>
  );
}
