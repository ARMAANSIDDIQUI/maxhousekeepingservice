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
  houseline: LuHouse,
  pihouseline: LuHouse,
  bath: LuBath,
  bathroom: LuBath,
  bathtub: LuBath,
  pibathtub: LuBath,
  cookingpot: LuCookingPot,
  picookingpot: LuCookingPot,
  kitchen: LuCookingPot,
  utensils: LuUtensils,
  chimney: LuCookingPot,
  sofa: LuArmchair,
  armchair: LuArmchair,
  piarmchair: LuArmchair,
  carpet: LuArmchair,
  upholstery: LuArmchair,
  sparkles: LuSparkles,
  cleaning: LuSparkles,
  deepclean: LuSparkles,
  deepcleaning: LuSparkles,
  bed: LuBed,
  mattress: LuBed,
  waves: LuWaves,
  water: LuWaves,
  watertank: LuWaves,
  tank: LuWaves,
  building: LuBuilding,
  building2: LuBuilding2,
  commercial: LuBuilding,
  office: LuBuilding,
  buildingoffice: LuBuilding,
  pibuildingoffice: LuBuilding,
  bug: LuBug,
  pibug: LuBug,
  pest: LuBug,
  pestcontrol: LuBug,
  shield: LuShieldCheck,
  shieldcheck: LuShieldCheck,
  sanitisation: LuShieldCheck,
  sanitization: LuShieldCheck,
  wrench: LuWrench,
  fan: LuFan,
  clock: LuClock,
  care: LuHeartHandshake,
  check: LuCircleCheck
};

export const AVAILABLE_ICONS = [
  { key: 'House', label: 'House / Full Home Deep Cleaning' },
  { key: 'Bath', label: 'Bath / Bathroom & Tiles Cleaning' },
  { key: 'CookingPot', label: 'CookingPot / Kitchen & Chimney' },
  { key: 'Armchair', label: 'Armchair / Sofa & Carpet Cleaning' },
  { key: 'Sparkles', label: 'Sparkles / Deep Clean Scrubbing' },
  { key: 'Bed', label: 'Bed / Mattress Sanitisation' },
  { key: 'Waves', label: 'Waves / Water Tank Cleaning' },
  { key: 'Building', label: 'Building / Commercial Office' },
  { key: 'Bug', label: 'Bug / Odorless Pest Control' },
  { key: 'Fan', label: 'Fan / Exhaust & Air Fixtures' },
  { key: 'Wrench', label: 'Wrench / Minor Maintenance' },
  { key: 'ShieldCheck', label: 'Shield / Anti-Bacterial Sanitisation' }
];

export function getServiceIcon(iconName, className = 'w-4 h-4') {
  if (!iconName) return <LuSparkles className={className} />;

  // Support passing a service or item object directly
  if (typeof iconName === 'object') {
    iconName = iconName.iconSnapshot || iconName.icon || iconName.iconKey || iconName.titleSnapshot || iconName.title || '';
    if (!iconName) return <LuSparkles className={className} />;
  }
  
  const raw = String(iconName).trim();
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
    return <img src={raw} alt="Service icon" className={`${className} object-contain`} />;
  }

  const rawLower = raw.toLowerCase();
  const cleanKey = rawLower.replace(/^pi/, '').replace(/^lu/, '').replace(/[^a-z0-9]/g, '');

  if (ICON_MAP[cleanKey]) {
    const IconComponent = ICON_MAP[cleanKey];
    return <IconComponent className={className} />;
  }

  // Semantic keyword heuristics if raw key contains common terms
  if (cleanKey.includes('bath') || cleanKey.includes('toilet') || cleanKey.includes('washroom') || cleanKey.includes('tile')) return <LuBath className={className} />;
  if (cleanKey.includes('kitchen') || cleanKey.includes('cook') || cleanKey.includes('chimney') || cleanKey.includes('utensil')) return <LuCookingPot className={className} />;
  if (cleanKey.includes('sofa') || cleanKey.includes('carpet') || cleanKey.includes('chair') || cleanKey.includes('couch') || cleanKey.includes('cushion') || cleanKey.includes('curtain')) return <LuArmchair className={className} />;
  if (cleanKey.includes('bed') || cleanKey.includes('mattress')) return <LuBed className={className} />;
  if (cleanKey.includes('water') || cleanKey.includes('tank') || cleanKey.includes('wave') || cleanKey.includes('pool')) return <LuWaves className={className} />;
  if (cleanKey.includes('office') || cleanKey.includes('commercial') || cleanKey.includes('build')) return <LuBuilding className={className} />;
  if (cleanKey.includes('pest') || cleanKey.includes('bug') || cleanKey.includes('termite') || cleanKey.includes('cockroach')) return <LuBug className={className} />;
  if (cleanKey.includes('home') || cleanKey.includes('house') || cleanKey.includes('balcony') || cleanKey.includes('flat') || cleanKey.includes('villa') || cleanKey.includes('apartment')) return <LuHouse className={className} />;
  if (cleanKey.includes('shield') || cleanKey.includes('sanit') || cleanKey.includes('disinfect')) return <LuShieldCheck className={className} />;
  if (cleanKey.includes('fan') || cleanKey.includes('exhaust')) return <LuFan className={className} />;
  if (cleanKey.includes('wrench') || cleanKey.includes('repair') || cleanKey.includes('fix')) return <LuWrench className={className} />;
  if (cleanKey.includes('sparkle') || cleanKey.includes('clean') || cleanKey.includes('scrub') || cleanKey.includes('glass') || cleanKey.includes('window') || cleanKey.includes('floor')) return <LuSparkles className={className} />;

  return <LuSparkles className={className} />;
}
