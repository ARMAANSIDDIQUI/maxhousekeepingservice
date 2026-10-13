import React from 'react';
import {
  LuHouse,
  LuBath,
  LuCookingPot,
  LuUtensils,
  LuArmchair,
  LuSparkles,
  LuBed,
  LuWaves,
  LuBuilding,
  LuBuilding2,
  LuBug,
  LuShieldCheck,
  LuWrench,
  LuFan,
  LuClock,
  LuHeartHandshake,
  LuCircleCheck
} from 'react-icons/lu';

const ICON_MAP = {
  home: LuHouse,
  house: LuHouse,
  bath: LuBath,
  bathroom: LuBath,
  cookingpot: LuCookingPot,
  kitchen: LuCookingPot,
  utensils: LuUtensils,
  sofa: LuArmchair,
  armchair: LuArmchair,
  sparkles: LuSparkles,
  cleaning: LuSparkles,
  bed: LuBed,
  mattress: LuBed,
  waves: LuWaves,
  water: LuWaves,
  building: LuBuilding,
  building2: LuBuilding2,
  commercial: LuBuilding,
  office: LuBuilding,
  bug: LuBug,
  pest: LuBug,
  shield: LuShieldCheck,
  shieldcheck: LuShieldCheck,
  wrench: LuWrench,
  fan: LuFan,
  clock: LuClock,
  care: LuHeartHandshake,
  check: LuCircleCheck
};

export const AVAILABLE_ICONS = [
  { key: 'House', label: 'House / Home' },
  { key: 'Bath', label: 'Bath / Bathroom' },
  { key: 'CookingPot', label: 'CookingPot / Kitchen' },
  { key: 'Armchair', label: 'Armchair / Sofa' },
  { key: 'Sparkles', label: 'Sparkles / Deep Clean' },
  { key: 'Bed', label: 'Bed / Mattress' },
  { key: 'Waves', label: 'Waves / Water Tank' },
  { key: 'Building', label: 'Building / Commercial' },
  { key: 'Bug', label: 'Bug / Pest Control' },
  { key: 'Fan', label: 'Fan / Air Fixtures' },
  { key: 'Wrench', label: 'Wrench / Repairs' },
  { key: 'ShieldCheck', label: 'Shield / Sanitisation' }
];

export function getServiceIcon(iconName, className = 'w-4 h-4') {
  if (!iconName) return <LuSparkles className={className} />;
  
  const cleanKey = String(iconName).trim().toLowerCase().replace(/^lu/, '');
  const IconComponent = ICON_MAP[cleanKey] || LuSparkles;
  
  return <IconComponent className={className} />;
}
