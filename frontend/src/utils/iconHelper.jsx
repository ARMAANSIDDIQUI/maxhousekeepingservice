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

export const DEFAULT_REALISTIC_ICON = '/icons/realistic/generalclean.png';

// Comprehensive 3D Miniature Realistic Icons (Every file verified on disk in public/icons/realistic/)
export const REALISTIC_ICONS = {
  // 0. Hotel & Hospitality
  hotel: '/icons/realistic/hotel.png',
  resort: '/icons/realistic/hotel.png',
  hospitality: '/icons/realistic/hotel.png',

  // 1. Sofa & Upholstery
  sofa: '/icons/realistic/sofa.png',
  armchair: '/icons/realistic/sofa.png',
  couch: '/icons/realistic/sofa.png',
  upholstery: '/icons/realistic/sofa.png',

  // 2. Chairs (Office & Dining)
  chair: '/icons/realistic/chair.png',
  chairs: '/icons/realistic/chair.png',
  diningchair: '/icons/realistic/chair.png',
  officechair: '/icons/realistic/chair.png',
  chairdrycleaning: '/icons/realistic/chair.png',

  // 3. Dining Table & Furniture Sets
  dining: '/icons/realistic/dining.png',
  diningtable: '/icons/realistic/dining.png',
  table: '/icons/realistic/dining.png',
  utensilscrossed: '/icons/realistic/dining.png',

  // 4. Carpet & Rugs
  carpet: '/icons/realistic/carpet.png',
  rug: '/icons/realistic/carpet.png',
  mat: '/icons/realistic/carpet.png',

  // 5. Stove & Kitchen
  stove: '/icons/realistic/stove.png',
  cookingpot: '/icons/realistic/stove.png',
  kitchen: '/icons/realistic/stove.png',
  gas: '/icons/realistic/stove.png',
  utensils: '/icons/realistic/stove.png',

  // 6. Kitchen Chimney & Exhaust
  chimney: '/icons/realistic/chimney.png',
  exhaust: '/icons/realistic/chimney.png',

  // 7. Bathroom & Toilet Commode
  bathroom: '/icons/realistic/bathroom.png',
  bath: '/icons/realistic/bathroom.png',
  toilet: '/icons/realistic/bathroom.png',
  washroom: '/icons/realistic/bathroom.png',
  commode: '/icons/realistic/bathroom.png',
  bathtub: '/icons/realistic/bathroom.png',

  // 8. Refrigerator & Fridge Cleaning
  fridge: '/icons/realistic/fridge.png',
  refrigerator: '/icons/realistic/fridge.png',
  freezer: '/icons/realistic/fridge.png',

  // 9. Bed, Mattress & Bedhead
  bed: '/icons/realistic/bed.png',
  mattress: '/icons/realistic/bed.png',
  bedhead: '/icons/realistic/bed.png',

  // 10. Full House Deep Clean
  fullhome: '/icons/realistic/fullhome.png',
  fullhouse: '/icons/realistic/fullhome.png',
  home: '/icons/realistic/fullhome.png',
  house: '/icons/realistic/fullhome.png',
  deepclean: '/icons/realistic/fullhome.png',
  deepcleaning: '/icons/realistic/fullhome.png',

  // 11. Overhead Water Tank & Sump
  watertank: '/icons/realistic/watertank.png',
  tank: '/icons/realistic/watertank.png',
  waves: '/icons/realistic/watertank.png',
  water: '/icons/realistic/watertank.png',

  // 12. Marble Polishing & Floor Buffing
  marble: '/icons/realistic/marble.png',
  floor: '/icons/realistic/marble.png',
  polishing: '/icons/realistic/marble.png',
  buffing: '/icons/realistic/marble.png',
  layers: '/icons/realistic/marble.png',

  // 13. Ceiling Fan & Fixtures
  fan: '/icons/realistic/fan.png',
  ceilingfan: '/icons/realistic/fan.png',

  // 14. Commercial Office & Business Workspaces
  office: '/icons/realistic/office.png',
  commercial: '/icons/realistic/office.png',
  building: '/icons/realistic/office.png',
  building2: '/icons/realistic/office.png',
  workplace: '/icons/realistic/office.png',

  // 15. Swimming Pool Cleaning & Care
  pool: '/icons/realistic/pool.png',
  swimming: '/icons/realistic/pool.png',
  swimmingpool: '/icons/realistic/pool.png',

  // 16. Windows, Doors & Glass
  window: '/icons/realistic/window.png',
  windows: '/icons/realistic/window.png',
  glass: '/icons/realistic/window.png',
  doorclosed: '/icons/realistic/window.png',
  door: '/icons/realistic/window.png',
  miniservices: '/icons/realistic/window.png',

  // 17. Curtains & Pleated Drapes
  curtain: '/icons/realistic/curtain.png',
  curtains: '/icons/realistic/curtain.png',
  drapes: '/icons/realistic/curtain.png',
  shirt: '/icons/realistic/curtain.png',

  // 18. Car Wash & Detailing
  car: '/icons/realistic/car.png',
  carwash: '/icons/realistic/car.png',
  vehicle: '/icons/realistic/car.png',

  // 19. Balcony Garden & Planters Care
  balcony: '/icons/realistic/balcony.png',
  garden: '/icons/realistic/balcony.png',
  plant: '/icons/realistic/balcony.png',
  treepine: '/icons/realistic/balcony.png',

  // 20. AC & Air Conditioner
  ac: '/icons/realistic/ac.png',
  airconditioner: '/icons/realistic/ac.png',
  accleaning: '/icons/realistic/ac.png',
  wind: '/icons/realistic/ac.png',

  // 21. Disinfection Shield & Hospital-Grade Sanitization
  disinfection: '/icons/realistic/disinfection.png',
  sanitization: '/icons/realistic/disinfection.png',
  shieldcheck: '/icons/realistic/disinfection.png',
  shield: '/icons/realistic/disinfection.png',

  // 22. Move-In / Vacancy Deep Cleaning
  movein: '/icons/realistic/movein.png',
  vacancy: '/icons/realistic/movein.png',
  package: '/icons/realistic/movein.png',
  relocation: '/icons/realistic/movein.png',

  // 23. Post-Construction Cleanup
  postconstruction: '/icons/realistic/postconstruction.png',
  construction: '/icons/realistic/postconstruction.png',
  renovation: '/icons/realistic/postconstruction.png',
  trash2: '/icons/realistic/postconstruction.png',
  trash: '/icons/realistic/postconstruction.png',

  // 24. General Clean & Daily Housekeeping Caddy
  generalclean: '/icons/realistic/generalclean.png',
  generalcleaning: '/icons/realistic/generalclean.png',
  housekeeping: '/icons/realistic/generalclean.png',
  caddy: '/icons/realistic/generalclean.png',
  sparkles: '/icons/realistic/generalclean.png',
  cleaning: '/icons/realistic/generalclean.png',

  // 25. Stain Treatment & Spot Removal
  staintreatment: '/icons/realistic/staintreatment.png',
  stain: '/icons/realistic/staintreatment.png',
  spotremoval: '/icons/realistic/staintreatment.png',
  paintbrush: '/icons/realistic/staintreatment.png',
  brush: '/icons/realistic/staintreatment.png',

  // 26. Plumbing Repair & Pipe Services
  plumbing: '/icons/realistic/plumbing.png',
  plumber: '/icons/realistic/plumbing.png',
  faucet: '/icons/realistic/plumbing.png',
  pipe: '/icons/realistic/plumbing.png',
  wrench: '/icons/realistic/plumbing.png',

  // 27. Carpentry & Furniture Repair
  carpentry: '/icons/realistic/carpentry.png',
  carpenter: '/icons/realistic/carpentry.png',
  woodwork: '/icons/realistic/carpentry.png',
  hammer: '/icons/realistic/carpentry.png',

  // 28. Electrical Work & Appliance Repairs
  electrical: '/icons/realistic/electrical.png',
  electrician: '/icons/realistic/electrical.png',
  zap: '/icons/realistic/electrical.png',
  wiring: '/icons/realistic/electrical.png',

  // 29. Pest Control & Termite Management
  pest: '/icons/realistic/pest.png',
  pestcontrol: '/icons/realistic/pest.png',
  bug: '/icons/realistic/pest.png',
  termite: '/icons/realistic/pest.png'
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
  chair: LuArmchair,
  chairs: LuArmchair,
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

// Curated list for Admin service icon dropdown - 100% Guaranteed 3D Realistic Miniature Icons
export const AVAILABLE_ICONS = [
  { key: 'sofa', label: 'Sofa' },
  { key: 'dining', label: 'Dining Table' },
  { key: 'chair', label: 'Chairs' },
  { key: 'bed', label: 'Bed & Mattress' },
  { key: 'stove', label: 'Kitchen & Stove' },
  { key: 'chimney', label: 'Chimney' },
  { key: 'bathroom', label: 'Bathroom' },
  { key: 'fridge', label: 'Refrigerator' },
  { key: 'carpet', label: 'Carpet' },
  { key: 'fullhome', label: 'Full Home Clean' },
  { key: 'watertank', label: 'Water Tank' },
  { key: 'marble', label: 'Marble & Floor' },
  { key: 'fan', label: 'Ceiling Fan' },
  { key: 'office', label: 'Commercial Office' },
  { key: 'pool', label: 'Swimming Pool' },
  { key: 'window', label: 'Window & Glass' },
  { key: 'curtain', label: 'Curtains' },
  { key: 'car', label: 'Car Wash' },
  { key: 'balcony', label: 'Balcony & Plants' },
  { key: 'ac', label: 'AC Cleaning' },
  { key: 'disinfection', label: 'Disinfection Shield' },
  { key: 'movein', label: 'Move-In / Vacancy' },
  { key: 'postconstruction', label: 'Post-Construction' },
  { key: 'generalclean', label: 'General Clean' },
  { key: 'staintreatment', label: 'Stain Treatment' },
  { key: 'plumbing', label: 'Plumbing Repair' },
  { key: 'carpentry', label: 'Carpentry Repair' },
  { key: 'electrical', label: 'Electrical Work' },
  { key: 'pest', label: 'Pest Control' }
];

/**
 * Resolves a realistic 3D image URL for a given clean key or keyword.
 * Word-boundary safe (never confuses "vacancy" or "surface" with "ac").
 */
export function getRealisticIconUrl(key) {
  if (!key) return null;
  const rawStr = String(key).trim();
  if (
    rawStr.startsWith('http://') ||
    rawStr.startsWith('https://') ||
    rawStr.startsWith('/icons/') ||
    rawStr.startsWith('/media/')
  ) {
    return rawStr;
  }

  const rawLower = rawStr.toLowerCase();
  const clean = rawLower.replace(/^pi/, '').replace(/^lu/, '').replace(/[^a-z0-9]/g, '');
  if (!clean) return null;

  if (REALISTIC_ICONS[clean]) return REALISTIC_ICONS[clean];

  // Specific priority heuristic substring matching
  if (clean.includes('dining') || clean.includes('crockery') || clean.includes('cutlery')) return REALISTIC_ICONS.dining;
  if (clean.includes('chair') || clean.includes('stool') || clean.includes('recliner') || clean.includes('seat')) {
    return clean.includes('armchair') ? REALISTIC_ICONS.sofa : REALISTIC_ICONS.chair;
  }
  if (clean.includes('sofa') || clean.includes('couch') || clean.includes('upholster') || clean.includes('settee') || clean.includes('cushion')) return REALISTIC_ICONS.sofa;
  if (clean.includes('bed') || clean.includes('mattress') || clean.includes('headboard') || clean.includes('cot') || clean.includes('pillow')) return REALISTIC_ICONS.bed;
  if (clean.includes('carpet') || clean.includes('rug') || clean.includes('durrie') || clean.includes('doormat') || clean === 'mat') return REALISTIC_ICONS.carpet;
  if (clean.includes('chimney') || clean.includes('exhaust')) return REALISTIC_ICONS.chimney;
  if (clean.includes('fridge') || clean.includes('refrigerat') || clean.includes('freezer')) return REALISTIC_ICONS.fridge;
  if (clean.includes('stove') || clean.includes('cook') || clean.includes('kitchen') || clean.includes('gas') || clean.includes('hob') || clean.includes('oven') || clean.includes('pantry') || clean.includes('modular')) return REALISTIC_ICONS.stove;
  if (clean.includes('bath') || clean.includes('toilet') || clean.includes('commode') || clean.includes('washroom') || clean.includes('shower') || clean.includes('basin') || clean.includes('lavatory')) return REALISTIC_ICONS.bathroom;
  if (clean.includes('watertank') || clean.includes('tank') || clean.includes('sump') || clean.includes('syntex') || clean.includes('overhead') || clean.includes('wave') || clean.includes('water')) return REALISTIC_ICONS.watertank;
  if (clean.includes('window') || clean.includes('glass') || clean.includes('door') || clean.includes('mirror') || clean.includes('grill')) return REALISTIC_ICONS.window;
  if (clean.includes('curtain') || clean.includes('drape') || clean.includes('blind') || clean.includes('fabric') || clean.includes('shirt') || clean.includes('linen')) return REALISTIC_ICONS.curtain;
  if (clean.includes('carwash') || clean.includes('vehicle') || clean.includes('suv') || clean.includes('sedan') || /\b(car|cars|auto)\b/.test(rawLower)) return REALISTIC_ICONS.car;
  if (clean.includes('marble') || clean.includes('granite') || clean.includes('buff') || clean.includes('polish') || clean.includes('terrazzo') || clean.includes('floor') || clean.includes('singledisc')) return REALISTIC_ICONS.marble;
  if (clean.includes('ceilingfan') || clean.includes('blower') || /\bfan(s)?\b/.test(rawLower)) return REALISTIC_ICONS.fan;
  if (clean.includes('balcony') || clean.includes('garden') || clean.includes('plant') || clean.includes('tree') || clean.includes('flower') || clean.includes('terrace') || clean.includes('lawn') || clean.includes('patio')) return REALISTIC_ICONS.balcony;
  if (clean.includes('office') || clean.includes('commercial') || clean.includes('build') || clean.includes('workplace') || clean.includes('corporate') || clean.includes('showroom') || clean.includes('clinic') || clean.includes('hotel') || clean.includes('gym') || clean.includes('shop')) return REALISTIC_ICONS.office;
  if (clean.includes('pool') || clean.includes('swim') || clean.includes('jacuzzi')) return REALISTIC_ICONS.pool;
  if (clean.includes('disinfect') || clean.includes('saniti') || clean.includes('shield') || clean.includes('fogging') || clean.includes('steril') || clean.includes('germ')) return REALISTIC_ICONS.disinfection;
  if (clean.includes('movein') || clean.includes('moveout') || clean.includes('vacan') || clean.includes('relocat') || clean.includes('shift') || clean.includes('package') || clean.includes('tenancy')) return REALISTIC_ICONS.movein;
  if (clean.includes('postconstruct') || clean.includes('construct') || clean.includes('renovat') || clean.includes('remodel') || clean.includes('debris') || clean.includes('trash')) return REALISTIC_ICONS.postconstruction;
  if (clean.includes('stain') || clean.includes('spot') || clean.includes('paintbrush') || clean.includes('grease') || clean.includes('shampoo') || clean.includes('scrub')) return REALISTIC_ICONS.staintreatment;
  if (clean.includes('plumb') || clean.includes('faucet') || clean.includes('pipe') || clean.includes('wrench') || clean.includes('tap') || clean.includes('leak') || clean.includes('drain')) return REALISTIC_ICONS.plumbing;
  if (clean.includes('carpent') || clean.includes('wood') || clean.includes('hammer') || clean.includes('hinge') || clean.includes('cabinet') || clean.includes('drawer')) return REALISTIC_ICONS.carpentry;
  if (clean.includes('electr') || clean.includes('wiring') || clean.includes('zap') || clean.includes('meter') || clean.includes('switch') || clean.includes('socket') || clean.includes('mcb')) return REALISTIC_ICONS.electrical;
  if (clean.includes('pest') || clean.includes('bug') || clean.includes('termite') || clean.includes('cockroach') || clean.includes('mosquito') || clean.includes('rodent') || clean.includes('fumigat')) return REALISTIC_ICONS.pest;
  if (
    clean === 'ac' ||
    clean === 'accleaning' ||
    clean.includes('aircond') ||
    clean.includes('splitac') ||
    clean.includes('windowac') ||
    /\bac\b/.test(rawLower) ||
    clean === 'wind'
  ) {
    return REALISTIC_ICONS.ac;
  }
  if (clean.includes('table')) return REALISTIC_ICONS.dining;
  if (
    clean.includes('fullhome') ||
    clean.includes('fullhouse') ||
    clean.includes('deepclean') ||
    clean.includes('wholehome') ||
    clean.includes('home') ||
    clean.includes('house') ||
    clean.includes('flat') ||
    clean.includes('villa') ||
    clean.includes('apartment') ||
    clean.includes('bungalow') ||
    clean.includes('bhk')
  ) {
    return REALISTIC_ICONS.fullhome;
  }
  if (clean.includes('general') || clean.includes('caddy') || clean.includes('maid') || clean.includes('housekeep') || clean.includes('sparkle') || clean.includes('clean')) {
    return REALISTIC_ICONS.generalclean;
  }

  return null;
}

const GENERIC_KEYS = new Set([
  '', 'sparkles', 'lusparkles', 'cleaning', 'clean', 'shieldcheck',
  'wrench', 'fan', 'house', 'home', 'shield', 'package', 'star', 'default'
]);

/**
 * Resolves the guaranteed 3D realistic PNG icon URL from any string or service/booking/category object.
 * NEVER returns null — falls back to DEFAULT_REALISTIC_ICON so no page ever shows a blank or missing icon.
 */
export function resolveRealisticIconUrl(iconInput) {
  if (!iconInput) return DEFAULT_REALISTIC_ICON;

  if (typeof iconInput === 'object') {
    const nestedSvc = iconInput.service && typeof iconInput.service === 'object' ? iconInput.service : null;

    const explicitRealistic =
      iconInput.realisticIconSnapshot ||
      iconInput.realisticIcon ||
      iconInput.realisticIconKey ||
      nestedSvc?.realisticIcon ||
      nestedSvc?.realisticIconKey ||
      '';

    const candidateKey =
      iconInput.iconSnapshot ||
      iconInput.icon ||
      iconInput.iconKey ||
      nestedSvc?.icon ||
      nestedSvc?.iconKey ||
      '';

    const titleOrSlug =
      iconInput.titleSnapshot ||
      iconInput.title ||
      iconInput.name ||
      iconInput.slug ||
      nestedSvc?.title ||
      nestedSvc?.name ||
      nestedSvc?.slug ||
      '';

    const categoryHint =
      iconInput.categoryName ||
      iconInput.categorySlug ||
      (typeof iconInput.category === 'object' ? (iconInput.category?.slug || iconInput.category?.name) : iconInput.category) ||
      nestedSvc?.categoryName ||
      nestedSvc?.categorySlug ||
      '';

    const cleanKeyLower = String(candidateKey).toLowerCase().replace(/^pi|^lu/, '').trim();
    const isGenericCandidate = GENERIC_KEYS.has(cleanKeyLower);

    const matched =
      getRealisticIconUrl(explicitRealistic) ||
      (isGenericCandidate ? getRealisticIconUrl(titleOrSlug) : null) ||
      getRealisticIconUrl(candidateKey) ||
      getRealisticIconUrl(titleOrSlug) ||
      getRealisticIconUrl(categoryHint);

    return matched || DEFAULT_REALISTIC_ICON;
  }

  return getRealisticIconUrl(iconInput) || DEFAULT_REALISTIC_ICON;
}

/**
 * Main Universal Service Icon Resolver:
 * Guarantees a photorealistic 3D miniature image on every single page.
 * Never returns a broken image or placeholder vector icon unless `options.forceVector === true`.
 */
export function getServiceIcon(iconName, className = 'w-4 h-4', options = {}) {
  if (options.forceVector) {
    const rawStr = typeof iconName === 'object'
      ? (iconName?.iconSnapshot || iconName?.icon || iconName?.iconKey || iconName?.title || '')
      : String(iconName || '');
    const cleanKey = rawStr.toLowerCase().trim().replace(/^pi/, '').replace(/^lu/, '').replace(/[^a-z0-9]/g, '');
    const IconComponent = ICON_MAP[cleanKey] || LuSparkles;
    return <IconComponent className={className} />;
  }

  const iconUrl = resolveRealisticIconUrl(iconName);
  const altLabel =
    typeof iconName === 'object'
      ? (iconName?.titleSnapshot || iconName?.title || iconName?.name || iconName?.icon || 'Service icon')
      : (String(iconName || '').trim() || 'Service icon');

  return (
    <img
      src={iconUrl}
      alt={altLabel}
      className={`${className} object-contain inline-block drop-shadow-xs select-none shrink-0`}
      loading="lazy"
      onError={(e) => {
        if (!e.currentTarget.dataset.fallbackApplied) {
          e.currentTarget.dataset.fallbackApplied = '1';
          e.currentTarget.src = DEFAULT_REALISTIC_ICON;
        }
      }}
    />
  );
}
