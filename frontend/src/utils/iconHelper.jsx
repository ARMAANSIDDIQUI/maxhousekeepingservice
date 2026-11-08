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
  LuCircleCheck,
  LuPaintbrush,
  LuBrush,
  LuCar,
  LuDroplets,
  LuSun,
  LuFlame,
  LuShirt,
  LuTrash2,
  LuPackage,
  LuLayers,
  LuGem,
  LuZap,
  LuWind,
  LuHotel,
  LuTreePine,
  LuFlower2,
  LuSprayCan,
  LuShowerHead,
  LuDoorClosed,
  LuUtensilsCrossed,
  LuHammer
} from 'react-icons/lu';

// Comprehensive 3D Miniature Realistic Icons (Inspired by NoBroker / Urban Company UI)
export const REALISTIC_ICONS = {
  // 1. Sofa & Upholstery
  sofa: '/icons/realistic/sofa.png',
  armchair: '/icons/realistic/sofa.png',
  couch: '/icons/realistic/sofa.png',
  upholstery: '/icons/realistic/sofa.png',

  // 2. Carpet & Rugs
  carpet: '/icons/realistic/carpet.png',
  rug: '/icons/realistic/carpet.png',
  mat: '/icons/realistic/carpet.png',

  // 3. Stove & Kitchen
  stove: '/icons/realistic/stove.png',
  cookingpot: '/icons/realistic/stove.png',
  kitchen: '/icons/realistic/stove.png',
  gas: '/icons/realistic/stove.png',
  utensils: '/icons/realistic/stove.png',

  // 4. Kitchen Chimney & Exhaust
  chimney: '/icons/realistic/chimney.png',
  exhaust: '/icons/realistic/chimney.png',

  // 5. Bathroom & Toilet Commode
  bathroom: '/icons/realistic/bathroom.png',
  bath: '/icons/realistic/bathroom.png',
  toilet: '/icons/realistic/bathroom.png',
  washroom: '/icons/realistic/bathroom.png',
  commode: '/icons/realistic/bathroom.png',
  bathtub: '/icons/realistic/bathroom.png',

  // 6. Windows, Doors & Glass
  window: '/icons/realistic/window.png',
  windows: '/icons/realistic/window.png',
  glass: '/icons/realistic/window.png',
  doorclosed: '/icons/realistic/window.png',
  door: '/icons/realistic/window.png',
  miniservices: '/icons/realistic/window.png',

  // 7. Bed, Mattress & Bedhead
  bed: '/icons/realistic/bed.png',
  mattress: '/icons/realistic/bed.png',
  bedhead: '/icons/realistic/bed.png',

  // 8. Full House Deep Clean
  fullhome: '/icons/realistic/fullhome.png',
  fullhouse: '/icons/realistic/fullhome.png',
  home: '/icons/realistic/fullhome.png',
  house: '/icons/realistic/fullhome.png',
  deepclean: '/icons/realistic/fullhome.png',
  deepcleaning: '/icons/realistic/fullhome.png',

  // 9. Overhead Water Tank & Sump
  watertank: '/icons/realistic/watertank.png',
  tank: '/icons/realistic/watertank.png',
  waves: '/icons/realistic/watertank.png',
  water: '/icons/realistic/watertank.png',

  // 10. Curtains & Pleated Drapes
  curtain: '/icons/realistic/curtain.png',
  curtains: '/icons/realistic/curtain.png',
  drapes: '/icons/realistic/curtain.png',
  shirt: '/icons/realistic/curtain.png',

  // 11. Car Wash & Detailing
  car: '/icons/realistic/car.png',
  carwash: '/icons/realistic/car.png',
  vehicle: '/icons/realistic/car.png',

  // 12. Pest & Termite Control
  pest: '/icons/realistic/pest.png',
  pestcontrol: '/icons/realistic/pest.png',
  bug: '/icons/realistic/pest.png',
  termite: '/icons/realistic/pest.png',

  // 13. AC Deep Cleaning & Servicing
  ac: '/icons/realistic/ac.png',
  airconditioner: '/icons/realistic/ac.png',
  wind: '/icons/realistic/ac.png',
  duct: '/icons/realistic/ac.png',

  // 14. Marble Polishing & Floor Buffing
  marble: '/icons/realistic/marble.png',
  floor: '/icons/realistic/marble.png',
  polishing: '/icons/realistic/marble.png',
  buffing: '/icons/realistic/marble.png',
  layers: '/icons/realistic/marble.png',

  // 15. Ceiling Fan & Fixtures
  fan: '/icons/realistic/fan.png',
  ceilingfan: '/icons/realistic/fan.png',

  // 16. Balcony Garden & Planters Care
  balcony: '/icons/realistic/balcony.png',
  garden: '/icons/realistic/balcony.png',
  plant: '/icons/realistic/balcony.png',

  // 17. Dining Table & Furniture Care
  dining: '/icons/realistic/dining.png',
  table: '/icons/realistic/dining.png',

  // 18. Refrigerator & Fridge Cleaning
  fridge: '/icons/realistic/fridge.png',
  refrigerator: '/icons/realistic/fridge.png',
  freezer: '/icons/realistic/fridge.png',

  // 19. Commercial Office & Business Workspaces
  office: '/icons/realistic/office.png',
  commercial: '/icons/realistic/office.png',
  building: '/icons/realistic/office.png',
  building2: '/icons/realistic/office.png',
  workplace: '/icons/realistic/office.png',

  // 20. Swimming Pool Cleaning & Care
  pool: '/icons/realistic/pool.png',
  swimming: '/icons/realistic/pool.png',
  swimmingpool: '/icons/realistic/pool.png'
};

const ICON_MAP = {
  home: LuHouse,
  house: LuHouse,
  bath: LuBath,
  bathroom: LuBath,
  bathtub: LuBath,
  cookingpot: LuCookingPot,
  kitchen: LuCookingPot,
  utensils: LuUtensils,
  chimney: LuCookingPot,
  sofa: LuArmchair,
  armchair: LuArmchair,
  carpet: LuArmchair,
  sparkles: LuSparkles,
  cleaning: LuSparkles,
  deepclean: LuSparkles,
  bed: LuBed,
  waves: LuWaves,
  watertank: LuWaves,
  building: LuBuilding,
  commercial: LuBuilding,
  office: LuBuilding,
  bug: LuBug,
  pest: LuBug,
  shield: LuShieldCheck,
  wrench: LuWrench,
  fan: LuFan,
  clock: LuClock,
  care: LuHeartHandshake,
  check: LuCircleCheck,
  paintbrush: LuPaintbrush,
  brush: LuBrush,
  car: LuCar,
  droplets: LuDroplets,
  sun: LuSun,
  solar: LuSun,
  flame: LuFlame,
  shirt: LuShirt,
  curtain: LuShirt,
  trash: LuTrash2,
  package: LuPackage,
  layers: LuLayers,
  gem: LuGem,
  zap: LuZap,
  wind: LuWind,
  ac: LuWind,
  hotel: LuHotel,
  treepine: LuTreePine,
  flower2: LuFlower2,
  spraycan: LuSprayCan,
  showerhead: LuShowerHead,
  doorclosed: LuDoorClosed,
  window: LuDoorClosed,
  utensilscrossed: LuUtensilsCrossed,
  hammer: LuHammer,
  handshake: LuHeartHandshake
};

// Curated list for Admin service icon dropdown
export const AVAILABLE_ICONS = [
  // Realistic 3D Icons
  { key: 'Sofa', label: '🛋️ 3D Sofa & Upholstery Spa' },
  { key: 'Bed', label: '🛏️ 3D Luxury Bed & Mattress' },
  { key: 'CookingPot', label: '🍳 3D Gas Stove & Kitchen' },
  { key: 'Chimney', label: '💨 3D Kitchen Electric Chimney' },
  { key: 'Bath', label: '🚽 3D Ceramic Toilet & Bathroom' },
  { key: 'Window', label: '🪟 3D Wooden Window & Glass' },
  { key: 'Carpet', label: '🧶 3D Ornate Woven Carpet & Rug' },
  { key: 'House', label: '🏡 3D Full Home Living Room Scene' },
  { key: 'Waves', label: '💧 3D Overhead Water Storage Tank' },
  { key: 'Shirt', label: '🧵 3D Pleated Luxury Curtains' },
  { key: 'Car', label: '🚗 3D Glossy Car Wash & Detailing' },
  { key: 'Bug', label: '🌿 3D Garden Pest Control Canister' },
  { key: 'Wind', label: '❄️ 3D Split AC & Air Filter Care' },
  { key: 'Layers', label: '🏛️ 3D Marble Polishing & Rotary Scrubber' },
  { key: 'Sun', label: '☀️ 3D Rooftop Solar Panel Cleaning' },
  { key: 'ShowerHead', label: '🚿 3D Chrome Tap & Shower Descaling' },
  { key: 'Fan', label: '🌀 3D Modern Ceiling Fan & Fixtures' },
  { key: 'TreePine', label: '🪴 3D Balcony Garden & Planters' },
  { key: 'Building', label: '🏢 3D Commercial Office Tower' },
  { key: 'UtensilsCrossed', label: '🍽️ 3D Dining Table & Cutlery Care' },
  { key: 'ShieldCheck', label: '🛡️ 3D Anti-Viral Disinfection Shield' },
  { key: 'Package', label: '📦 3D Move-In / Move-Out Vacancy Pack' },
  { key: 'Trash2', label: '🗑️ 3D Post-Construction Industrial Vacuum' },

  // Supplementary Icons
  { key: 'Sparkles', label: '✨ Sparkles / General Intensive Clean' },
  { key: 'Brush', label: '🧹 Brush / Heavy Floor Grout Cleaning' },
  { key: 'Paintbrush', label: '🎨 Paintbrush / Wall Stain Touchup' },
  { key: 'Wrench', label: '🔧 Wrench / Plumbing & Fixture Repair' },
  { key: 'Hammer', label: '🔨 Hammer / Minor Carpentry Fitting' },
  { key: 'Zap', label: '⚡ Zap / Electrical Switchboards & Lights' },
  { key: 'Gem', label: '💎 Gem / VIP Luxury White-Glove Care' },
  { key: 'HeartHandshake', label: '🤝 Care / Recurring Maid Assistance' }
];

/**
 * Resolves a realistic 3D image URL for a given clean key or keyword
 */
export function getRealisticIconUrl(key) {
  if (!key) return null;
  const clean = String(key).toLowerCase().replace(/^pi/, '').replace(/^lu/, '').replace(/[^a-z0-9]/g, '');
  if (REALISTIC_ICONS[clean]) return REALISTIC_ICONS[clean];

  // Heuristic substring matching
  if (clean.includes('sofa') || clean.includes('armchair') || clean.includes('couch') || clean.includes('upholster')) return REALISTIC_ICONS.sofa;
  if (clean.includes('bed') || clean.includes('mattress') || clean.includes('bedhead')) return REALISTIC_ICONS.bed;
  if (clean.includes('carpet') || clean.includes('rug') || clean.includes('mat')) return REALISTIC_ICONS.carpet;
  if (clean.includes('stove') || clean.includes('cook') || clean.includes('kitchen') || clean.includes('gas')) return REALISTIC_ICONS.stove;
  if (clean.includes('chimney') || clean.includes('exhaust')) return REALISTIC_ICONS.chimney;
  if (clean.includes('bath') || clean.includes('toilet') || clean.includes('commode') || clean.includes('washroom')) return REALISTIC_ICONS.bathroom;
  if (clean.includes('window') || clean.includes('glass') || clean.includes('doorclosed')) return REALISTIC_ICONS.window;
  if (clean.includes('water') || clean.includes('tank') || clean.includes('wave') || clean.includes('sump')) return REALISTIC_ICONS.watertank;
  if (clean.includes('curtain') || clean.includes('drape') || clean.includes('fabric') || clean.includes('shirt')) return REALISTIC_ICONS.curtain;
  if (clean.includes('car') || clean.includes('vehicle') || clean.includes('auto')) return REALISTIC_ICONS.car;
  if (clean.includes('pest') || clean.includes('bug') || clean.includes('termite')) return REALISTIC_ICONS.pest;
  if (clean.includes('ac') || clean.includes('aircond') || clean.includes('duct') || clean.includes('wind')) return REALISTIC_ICONS.ac;
  if (clean.includes('marble') || clean.includes('buff') || clean.includes('scrub') || clean.includes('layer') || clean.includes('polish')) return REALISTIC_ICONS.marble;
  if (clean.includes('fan')) return REALISTIC_ICONS.fan;
  if (clean.includes('balcony') || clean.includes('garden') || clean.includes('plant') || clean.includes('tree') || clean.includes('flower')) return REALISTIC_ICONS.balcony;
  if (clean.includes('fridge') || clean.includes('refrigerat') || clean.includes('freezer')) return REALISTIC_ICONS.fridge;
  if (clean.includes('office') || clean.includes('commercial') || clean.includes('build') || clean.includes('workplace') || clean.includes('tower')) return REALISTIC_ICONS.office;
  if (clean.includes('pool') || clean.includes('swim')) return REALISTIC_ICONS.pool;
  if (clean.includes('dining') || clean.includes('table') || clean.includes('crockery') || clean.includes('cutlery')) return REALISTIC_ICONS.dining;
  if (clean.includes('home') || clean.includes('house') || clean.includes('flat') || clean.includes('villa') || clean.includes('apartment') || clean.includes('deepclean')) return REALISTIC_ICONS.fullhome;

  return null;
}

/**
 * Main Service Icon Resolver:
 * Prioritizes realistic 3D miniature icons (like NoBroker / Urban Company) while
 * retaining 100% backward compatibility with MongoDB keys and Lucide React fallback.
 */
export function getServiceIcon(iconName, className = 'w-4 h-4', options = {}) {
  if (!iconName) return <LuSparkles className={className} />;

  let candidateKey = '';
  let realisticExplicit = '';
  let fallbackTitle = '';

  // 1. Support passing service or item object directly
  if (typeof iconName === 'object') {
    realisticExplicit = iconName.realisticIconSnapshot || iconName.realisticIcon || iconName.realisticIconKey || '';
    candidateKey = iconName.iconSnapshot || iconName.icon || iconName.iconKey || '';
    fallbackTitle = iconName.titleSnapshot || iconName.title || iconName.slug || iconName.name || '';
  } else {
    const str = String(iconName).trim();
    candidateKey = str;
    fallbackTitle = str;
  }

  // 2. Direct custom URL or image path provided
  const rawCandidate = String(realisticExplicit || candidateKey).trim();
  if (rawCandidate.startsWith('http://') || rawCandidate.startsWith('https://') || rawCandidate.startsWith('/icons/') || rawCandidate.startsWith('/media/')) {
    return (
      <img
        src={rawCandidate}
        alt="Service icon"
        className={`${className} object-contain inline-block select-none shrink-0`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // 3. Check for Realistic 3D Icon Match (Explicit Key -> Title/Domain Heuristics -> Candidate Key)
  const isGenericCandidate = !candidateKey || ['sparkles', 'shieldcheck', 'wrench', 'fan', 'house', 'shield'].includes(candidateKey.toLowerCase());
  
  const realisticMatch =
    getRealisticIconUrl(realisticExplicit) ||
    (isGenericCandidate && fallbackTitle ? getRealisticIconUrl(fallbackTitle) : null) ||
    getRealisticIconUrl(candidateKey) ||
    (fallbackTitle ? getRealisticIconUrl(fallbackTitle) : null);

  if (realisticMatch && !options.forceVector) {
    return (
      <img
        src={realisticMatch}
        alt={candidateKey || fallbackTitle || 'Service icon'}
        className={`${className} object-contain inline-block drop-shadow-xs select-none shrink-0`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // 4. Lucide React-Icon Fallback
  const rawLower = String(candidateKey || fallbackTitle || '').toLowerCase().trim();
  const cleanKey = rawLower.replace(/^pi/, '').replace(/^lu/, '').replace(/[^a-z0-9]/g, '');

  if (ICON_MAP[cleanKey]) {
    const IconComponent = ICON_MAP[cleanKey];
    return <IconComponent className={className} />;
  }

  return <LuSparkles className={className} />;
}
