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
  bedhead: LuBed,
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
  termite: LuBug,
  shield: LuShieldCheck,
  shieldcheck: LuShieldCheck,
  sanitisation: LuShieldCheck,
  sanitization: LuShieldCheck,
  wrench: LuWrench,
  fan: LuFan,
  clock: LuClock,
  care: LuHeartHandshake,
  check: LuCircleCheck,
  paintbrush: LuPaintbrush,
  brush: LuBrush,
  car: LuCar,
  carwash: LuCar,
  vehicle: LuCar,
  droplets: LuDroplets,
  pressurewash: LuDroplets,
  jetwash: LuDroplets,
  sun: LuSun,
  solar: LuSun,
  terrace: LuSun,
  flame: LuFlame,
  degrease: LuFlame,
  shirt: LuShirt,
  curtain: LuShirt,
  curtains: LuShirt,
  laundry: LuShirt,
  trash: LuTrash2,
  trash2: LuTrash2,
  debris: LuTrash2,
  waste: LuTrash2,
  package: LuPackage,
  movein: LuPackage,
  moveout: LuPackage,
  vacancy: LuPackage,
  layers: LuLayers,
  marble: LuLayers,
  polishing: LuLayers,
  buffing: LuLayers,
  floor: LuLayers,
  gem: LuGem,
  vip: LuGem,
  luxury: LuGem,
  premium: LuGem,
  zap: LuZap,
  electric: LuZap,
  switchboard: LuZap,
  chandelier: LuZap,
  wind: LuWind,
  ac: LuWind,
  airconditioner: LuWind,
  duct: LuWind,
  hotel: LuHotel,
  restaurant: LuHotel,
  treepine: LuTreePine,
  tree: LuTreePine,
  garden: LuTreePine,
  flower2: LuFlower2,
  flower: LuFlower2,
  lawn: LuFlower2,
  spraycan: LuSprayCan,
  spray: LuSprayCan,
  mist: LuSprayCan,
  showerhead: LuShowerHead,
  shower: LuShowerHead,
  descaling: LuShowerHead,
  doorclosed: LuDoorClosed,
  door: LuDoorClosed,
  windows: LuDoorClosed,
  window: LuDoorClosed,
  glass: LuDoorClosed,
  utensilscrossed: LuUtensilsCrossed,
  dining: LuUtensilsCrossed,
  hammer: LuHammer,
  repair: LuHammer,
  handshake: LuHeartHandshake
};

export const AVAILABLE_ICONS = [
  { key: 'House', label: 'House / Full Home Deep Cleaning' },
  { key: 'Bath', label: 'Bath / Bathroom & Tile Scrubbing' },
  { key: 'CookingPot', label: 'CookingPot / Kitchen & Chimney Cleaning' },
  { key: 'Armchair', label: 'Armchair / Sofa & Carpet Shampooing' },
  { key: 'Bed', label: 'Bed / Mattress & Bedhead Drycleaning' },
  { key: 'Sparkles', label: 'Sparkles / Intensive Scrubbing & Polish' },
  { key: 'Waves', label: 'Waves / Water Tank & Sump Sanitization' },
  { key: 'Droplets', label: 'Droplets / High-Pressure Jet Wash' },
  { key: 'Layers', label: 'Layers / Marble Polishing & Floor Buffing' },
  { key: 'Brush', label: 'Brush / Heavy Floor & Grout Cleaning' },
  { key: 'Paintbrush', label: 'Paintbrush / Wall Stain Removal & Touchup' },
  { key: 'Car', label: 'Car / Vehicle Wash & Interior Detailing' },
  { key: 'Wind', label: 'Wind / AC Servicing & Duct Cleaning' },
  { key: 'Fan', label: 'Fan / Ceiling Fans & Exhaust Fixtures' },
  { key: 'ShowerHead', label: 'ShowerHead / Tap & Hard Water Descaling' },
  { key: 'SprayCan', label: 'SprayCan / Chemical Mist Sanitization' },
  { key: 'Bug', label: 'Bug / Herbal Pest & Termite Control' },
  { key: 'ShieldCheck', label: 'Shield / Anti-Viral Disinfection' },
  { key: 'Package', label: 'Package / Move-In & Vacancy Cleaning' },
  { key: 'Building', label: 'Building / Commercial Office Cleaning' },
  { key: 'Hotel', label: 'Hotel / Restaurant & Hospitality Cleaning' },
  { key: 'Sun', label: 'Sun / Solar Panel & Rooftop Terrace Care' },
  { key: 'Flame', label: 'Flame / Kitchen Chimney & Burner Degreasing' },
  { key: 'Shirt', label: 'Shirt / Curtain & Fabric Steam Cleaning' },
  { key: 'Trash2', label: 'Trash / Post-Construction Debris Clearance' },
  { key: 'DoorClosed', label: 'Door / Glass Partition, Window & Mesh Care' },
  { key: 'Wrench', label: 'Wrench / General Plumbing & Fixture Repair' },
  { key: 'Hammer', label: 'Hammer / Minor Carpentry & Fitting Work' },
  { key: 'Zap', label: 'Zap / Electrical Switchboards & Chandeliers' },
  { key: 'Gem', label: 'Gem / Luxury Villa VIP White-Glove Service' },
  { key: 'TreePine', label: 'Tree / Balcony Garden & Planters Care' },
  { key: 'Flower2', label: 'Flower / Lawn & Outdoor Patio Cleaning' },
  { key: 'UtensilsCrossed', label: 'Utensils / Dining Area & Cutlery Clean' },
  { key: 'HeartHandshake', label: 'Care / Recurring Maid & Elderly Assistance' }
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

  // Semantic keyword heuristics (checked in specific order)
  if (cleanKey.includes('bed') || cleanKey.includes('mattress')) return <LuBed className={className} />;
  if (cleanKey.includes('bath') || cleanKey.includes('toilet') || cleanKey.includes('washroom') || cleanKey.includes('tile')) return <LuBath className={className} />;
  if (cleanKey.includes('kitchen') || cleanKey.includes('cook') || cleanKey.includes('chimney') || cleanKey.includes('utensil')) return <LuCookingPot className={className} />;
  if (cleanKey.includes('sofa') || cleanKey.includes('carpet') || cleanKey.includes('chair') || cleanKey.includes('couch') || cleanKey.includes('cushion')) return <LuArmchair className={className} />;
  if (cleanKey.includes('curtain') || cleanKey.includes('drape') || cleanKey.includes('fabric')) return <LuShirt className={className} />;
  if (cleanKey.includes('car') || cleanKey.includes('vehicle') || cleanKey.includes('auto')) return <LuCar className={className} />;
  if (cleanKey.includes('paint') || cleanKey.includes('stain')) return <LuPaintbrush className={className} />;
  if (cleanKey.includes('marble') || cleanKey.includes('polish') || cleanKey.includes('buff') || cleanKey.includes('layer')) return <LuLayers className={className} />;
  if (cleanKey.includes('water') || cleanKey.includes('tank') || cleanKey.includes('wave') || cleanKey.includes('sump')) return <LuWaves className={className} />;
  if (cleanKey.includes('jet') || cleanKey.includes('pressure') || cleanKey.includes('droplet')) return <LuDroplets className={className} />;
  if (cleanKey.includes('solar') || cleanKey.includes('terrace') || cleanKey.includes('rooftop')) return <LuSun className={className} />;
  if (cleanKey.includes('office') || cleanKey.includes('commercial') || cleanKey.includes('build')) return <LuBuilding className={className} />;
  if (cleanKey.includes('hotel') || cleanKey.includes('restaurant') || cleanKey.includes('resort')) return <LuHotel className={className} />;
  if (cleanKey.includes('pest') || cleanKey.includes('bug') || cleanKey.includes('termite') || cleanKey.includes('cockroach')) return <LuBug className={className} />;
  if (cleanKey.includes('home') || cleanKey.includes('house') || cleanKey.includes('flat') || cleanKey.includes('villa') || cleanKey.includes('apartment')) return <LuHouse className={className} />;
  if (cleanKey.includes('shield') || cleanKey.includes('sanit') || cleanKey.includes('disinfect')) return <LuShieldCheck className={className} />;
  if (cleanKey.includes('ac') || cleanKey.includes('duct') || cleanKey.includes('vent') || cleanKey.includes('wind')) return <LuWind className={className} />;
  if (cleanKey.includes('fan') || cleanKey.includes('exhaust')) return <LuFan className={className} />;
  if (cleanKey.includes('descaling') || cleanKey.includes('scale') || cleanKey.includes('shower')) return <LuShowerHead className={className} />;
  if (cleanKey.includes('spray') || cleanKey.includes('mist')) return <LuSprayCan className={className} />;
  if (cleanKey.includes('debris') || cleanKey.includes('rubble') || cleanKey.includes('waste') || cleanKey.includes('trash')) return <LuTrash2 className={className} />;
  if (cleanKey.includes('move') || cleanKey.includes('vacan') || cleanKey.includes('pack')) return <LuPackage className={className} />;
  if (cleanKey.includes('door') || cleanKey.includes('window') || cleanKey.includes('glass')) return <LuDoorClosed className={className} />;
  if (cleanKey.includes('wrench') || cleanKey.includes('plumb')) return <LuWrench className={className} />;
  if (cleanKey.includes('hammer') || cleanKey.includes('carpent') || cleanKey.includes('fix')) return <LuHammer className={className} />;
  if (cleanKey.includes('electric') || cleanKey.includes('wire') || cleanKey.includes('switch') || cleanKey.includes('zap')) return <LuZap className={className} />;
  if (cleanKey.includes('luxury') || cleanKey.includes('vip') || cleanKey.includes('gem')) return <LuGem className={className} />;
  if (cleanKey.includes('garden') || cleanKey.includes('balcony') || cleanKey.includes('tree') || cleanKey.includes('plant')) return <LuTreePine className={className} />;
  if (cleanKey.includes('lawn') || cleanKey.includes('patio') || cleanKey.includes('flower')) return <LuFlower2 className={className} />;
  if (cleanKey.includes('dining') || cleanKey.includes('cutlery') || cleanKey.includes('crockery')) return <LuUtensilsCrossed className={className} />;
  if (cleanKey.includes('care') || cleanKey.includes('maid') || cleanKey.includes('helper')) return <LuHeartHandshake className={className} />;
  if (cleanKey.includes('sparkle') || cleanKey.includes('clean') || cleanKey.includes('scrub')) return <LuSparkles className={className} />;

  return <LuSparkles className={className} />;
}
