/**
 * Centralized Axios API Client with Comprehensive Fallbacks
 * Max Housekeeping Service - Western UP (India)
 * Single API source for all frontend network requests
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';

// Create single Axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor: attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage may not be accessible in SSR/sandbox environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwraps data and catches formatted errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend returns a formatted error response with message
    if (error.response && error.response.data) {
      const serverMsg = error.response.data.message || error.response.data.error;
      if (serverMsg) {
        return Promise.reject(new Error(serverMsg));
      }
    }
    return Promise.reject(error);
  }
);

// ========================================================
// COMPREHENSIVE FALLBACK REPOSITORY (Activated if Network Fails)
// ========================================================

export const FALLBACK_CATEGORIES = [
  {
    _id: '6ace40253bcdb872f58436cf',
    name: 'Home Cleaning',
    slug: 'home-deep-cleaning',
    description: 'Whole-house scrub, single-disc floor buffing & hospital-grade disinfection.',
    serviceCount: 4,
    iconKey: 'House',
    image: { url: '/media/categories/home-deep-cleaning.jpg', alt: 'Home deep cleaning' }
  },
  {
    _id: '6ace40253bcdb872f58436d0',
    name: 'Bathroom Cleaning',
    slug: 'bathroom-cleaning',
    description: 'Acid-free tile descaling, hard water stain removal & chrome tap polish.',
    serviceCount: 2,
    iconKey: 'Bath',
    image: { url: '/media/categories/bathroom-cleaning.jpg', alt: 'Bathroom cleaning' }
  },
  {
    _id: '6ace40253bcdb872f58436d1',
    name: 'Kitchen Cleaning',
    slug: 'kitchen-cleaning',
    description: 'Heavy grease extraction, chimney degrease & countertop hygiene scrub.',
    serviceCount: 3,
    iconKey: 'CookingPot',
    image: { url: '/media/categories/kitchen-cleaning.jpg', alt: 'Kitchen cleaning' }
  },
  {
    _id: '6ace40253bcdb872f58436d2',
    name: 'Sofa & Carpet Cleaning',
    slug: 'sofa-carpet-cleaning',
    description: 'Industrial wet injection-extraction shampooing & fast moisture suction.',
    serviceCount: 4,
    iconKey: 'Armchair',
    image: { url: '/media/categories/sofa-carpet-cleaning.jpg', alt: 'Sofa and carpet cleaning' }
  },
  {
    _id: '6ace40253bcdb872f58436d3',
    name: 'Commercial Cleaning',
    slug: 'commercial-cleaning',
    description: 'Offices, showrooms, banks, gyms & corporate facility housekeeping.',
    serviceCount: 2,
    iconKey: 'Building',
    image: { url: '/media/categories/commercial-cleaning.jpg', alt: 'Commercial cleaning' }
  },
  {
    _id: '6ace40253bcdb872f58436d4',
    name: 'Pest Control',
    slug: 'pest-control',
    description: 'Odorless herbal gel pest treatments & long-lasting barrier protection.',
    serviceCount: 1,
    iconKey: 'Bug',
    image: { url: '/media/categories/pest-control.jpg', alt: 'Pest control' }
  }
];

export const FALLBACK_CITIES = [
  { name: 'Moradabad', slug: 'moradabad', state: 'Uttar Pradesh', pincodes: ['244001', '244002', '244102', '244103', '244104'] },
  { name: 'Rampur', slug: 'rampur', state: 'Uttar Pradesh', pincodes: ['244901', '244924', '244927'] },
  { name: 'Amroha', slug: 'amroha', state: 'Uttar Pradesh', pincodes: ['244221', '244222', '244236'] },
  { name: 'Gajraula', slug: 'gajraula', state: 'Uttar Pradesh', pincodes: ['244235'] },
  { name: 'Sambhal', slug: 'sambhal', state: 'Uttar Pradesh', pincodes: ['244302', '244303'] },
  { name: 'Chandausi', slug: 'chandausi', state: 'Uttar Pradesh', pincodes: ['244412'] },
  { name: 'Noorpur', slug: 'noorpur', state: 'Uttar Pradesh', pincodes: ['246734'] },
  { name: 'Dhampur', slug: 'dhampur', state: 'Uttar Pradesh', pincodes: ['246761'] },
  { name: 'Bijnor', slug: 'bijnor', state: 'Uttar Pradesh', pincodes: ['246701'] },
  { name: 'Kanth', slug: 'kanth', state: 'Uttar Pradesh', pincodes: ['244501'] }
];

export const FALLBACK_BRANDS = [
  { name: 'Bank Of Baroda', logoUrl: '/brands/bank-of-baroda.jpg' },
  { name: 'Geetanjali Salon', logoUrl: '/brands/geetanjali-salon.jpg' },
  { name: 'Kundans', logoUrl: '/brands/kundans.jpg' },
  { name: 'Redtape', logoUrl: '/brands/redtape.jpg' },
  { name: 'Punjab National Bank', logoUrl: '/brands/punjab-national-bank.jpg' },
  { name: 'Subway', logoUrl: '/brands/subway.jpg' },
  { name: 'Temptations', logoUrl: '/brands/temptations.jpg' },
  { name: 'V-Mart', logoUrl: '/brands/v-mart.jpg' },
  { name: 'Tanishq', logoUrl: '/brands/tanishq.jpg' },
  { name: 'Metro', logoUrl: '/brands/metro.jpg' },
  { name: 'Bikanervala', logoUrl: '/brands/bikanervala.jpg' },
  { name: 'Gajraula Haveli', logoUrl: '/brands/gajraula.jpg' },
  { name: 'Gold\'s Gym', logoUrl: '/brands/goldgym.jpg' },
  { name: 'Mooga', logoUrl: '/brands/mooga.jpg' },
  { name: 'NGM Group', logoUrl: '/brands/ngm.jpg' }
];

export const FALLBACK_TESTIMONIALS = [
  {
    name: 'Dr. Alok Verma',
    role: 'Civil Lines Resident',
    city: 'Moradabad',
    quote: 'Booked Full Home Deep Cleaning before Diwali. The team arrived on time in clean uniforms, used heavy floor scrubbers, and took almost 6 hours to make the house spotless. Very impressed.',
    rating: 5
  },
  {
    name: 'Neha Singhal',
    role: 'Homeowner',
    city: 'Rampur',
    quote: 'Our sofa had coffee stains and dust from months. Their technician shampooed it thoroughly with a wet vacuum. By evening it was completely dry and looked brand new.',
    rating: 5
  },
  {
    name: 'Branch Operations Manager',
    role: 'Commercial Facility Lead',
    city: 'Moradabad',
    quote: 'Max Housekeeping handles the commercial cleaning for our branch floor and reception. Very reliable, professional staff, and transparent billing.',
    rating: 5
  },
  {
    name: 'Mohit Agarwal',
    role: 'Retail Showroom Owner',
    city: 'Amroha',
    quote: 'Quick response time, proper equipment and polite crew. Highly recommended for commercial and residential deep cleaning across Western UP.',
    rating: 5
  }
];

export const FALLBACK_STATS = {
  totalBookings: 148,
  revenue: 389450,
  activeSquads: 8,
  pendingRequests: 4,
  completionRate: '99.2%'
};

export const FALLBACK_SERVICES = [
  {
    _id: 's_full_home',
    title: 'Full Home Deep Cleaning',
    slug: 'full-home-deep-cleaning',
    aliases: [
      'service_full-home-deep-cleaning-1-bhk',
      'service_full-home-deep-cleaning-2-bhk',
      'service_full-home-deep-cleaning-3-bhk',
      'service_full-home-deep-cleaning-4-bhk'
    ],
    categoryName: 'Home Cleaning',
    categorySlug: 'home-deep-cleaning',
    icon: 'House',
    price: 2800,
    mrp: 2999,
    duration: '4-5 hrs',
    isPopular: true,
    sortOrder: 1,
    shortDescription: 'Complete residential deep cleaning with floor scrubbing machines, bathroom tile descaling, and dusting.',
    description: 'Our signature whole-house treatment covers every corner of your home. Professional crew equipped with industrial single-disc floor scrubbers, wet extraction vacuums, and eco-friendly Taski chemicals.',
    media: { hero: { url: '/media/services/full-home-deep-cleaning.jpg', alt: 'Full home deep cleaning worker in uniform' } },
    inclusions: [
      'Floor scrubbing with single-disc machine',
      'All bathrooms ceiling-to-floor acid-free tile descaling',
      'Kitchen slab, sink, tiles, and cabinet exterior wipe',
      'Window glass, tracks, grills, and mesh cleaning',
      'Ceiling fans, switchboards, and doors disinfection'
    ],
    exclusions: [
      'Inside occupied closets without owner supervision',
      'Heavy furniture shifting outside the room',
      'Wall paint repair or patch fixing'
    ],
    optionGroups: [
      {
        key: 'size',
        label: 'Apartment / House Size',
        type: 'single',
        required: true,
        options: [
          { key: '1-bhk', label: '1 BHK', isDefault: true, priceDelta: 0, mrpDelta: 0 },
          { key: '2-bhk', label: '2 BHK', priceDelta: 3200, mrpDelta: 4500 },
          { key: '3-bhk', label: '3 BHK', priceDelta: 6700, mrpDelta: 7501 },
          { key: '4-bhk', label: '4 BHK', priceDelta: 9700, mrpDelta: 12001 },
          { key: 'villa', label: 'Villa / Kothi (5+ BHK)', priceDelta: 15200, mrpDelta: 19001 }
        ]
      }
    ],
    matrix: [
      { selection: { size: '1-bhk' }, price: 2800, mrp: 2999, duration: '4-5 hrs' },
      { selection: { size: '2-bhk' }, price: 6000, mrp: 7499, duration: '5-7 hrs' },
      { selection: { size: '3-bhk' }, price: 9500, mrp: 10500, duration: '7-9 hrs' },
      { selection: { size: '4-bhk' }, price: 12500, mrp: 15000, duration: '2 Days' },
      { selection: { size: 'villa' }, price: 18000, mrp: 22000, duration: '2-3 Days' }
    ]
  },
  {
    _id: 's_bathroom',
    title: 'Bathroom Deep Cleaning',
    slug: 'bathroom-deep-cleaning',
    aliases: [
      'service_bathroom-tiles-cleaning-medium-size',
      'service_bathroom-tiles-cleaning-large-size',
      'service_medium-size-tile-wala',
      'service_large-size-tile-wala'
    ],
    categoryName: 'Bathroom Cleaning',
    categorySlug: 'bathroom-cleaning',
    icon: 'Bath',
    price: 799,
    mrp: 999,
    duration: '1.5 hrs',
    isPopular: true,
    sortOrder: 2,
    shortDescription: 'Deep tile descaling, hard water stain removal, taps polishing, and toilet sanitisation.',
    description: 'Remove stubborn yellow hard water scaling and soap scum without damaging your ceramic or marble tiles. Acid-free hospital-grade sanitisation.',
    media: { hero: { url: '/media/services/bathroom-tile-cleaning.jpg', alt: 'Bathroom tile cleaning worker in uniform' } },
    inclusions: [
      'Wall tiles scaling removal and rotary brush buffing',
      'Shower glass enclosure water mark removal',
      'Chrome CP fittings and taps brass/steel shine polishing',
      'Toilet commode, washbasin, and vanity sanitisation'
    ],
    optionGroups: [
      {
        key: 'size',
        label: 'Bathroom Size',
        type: 'single',
        options: [
          { key: 'medium', label: 'Standard / Medium Bathroom', isDefault: true },
          { key: 'large', label: 'Master / Large Bathroom with Glass Enclosure' }
        ]
      }
    ],
    matrix: [
      { selection: { size: 'medium' }, price: 799, mrp: 999, duration: '1-1.5 hrs' },
      { selection: { size: 'large' }, price: 1199, mrp: 1499, duration: '1.5-2 hrs' }
    ]
  },
  {
    _id: 's_kitchen',
    title: 'Kitchen Deep Cleaning',
    slug: 'kitchen-deep-cleaning',
    aliases: [
      'service_kitchen-deep-cleaning-medium-size-kitchen',
      'service_kitchen-deep-cleaning-big-size-kitchen',
      'service_kitchen-deep-cleaning-big-size-hotel-kitchen'
    ],
    categoryName: 'Kitchen Cleaning',
    categorySlug: 'kitchen-cleaning',
    icon: 'CookingPot',
    price: 1499,
    mrp: 1899,
    duration: '2.5 hrs',
    isPopular: true,
    sortOrder: 3,
    shortDescription: 'Intense grease degreasing, chimney filter cleaning, gas stove and tile scrubbing.',
    description: 'Eliminates sticky cooking oil layers from kitchen walls, slabs, exhaust fans, and cabinet shutters with food-safe degreasers.',
    media: { hero: { url: '/media/services/kitchen-deep-cleaning.jpg', alt: 'Kitchen deep cleaning worker in uniform' } },
    inclusions: [
      'Chimney filter wash and outer casing degreasing',
      'Gas stove, burners, and backsplash tile scrub',
      'Cabinet doors exterior wipe and handles polish',
      'Sink sanitisation and drain pipe odor neutralisation'
    ],
    optionGroups: [
      {
        key: 'size',
        label: 'Kitchen Type',
        type: 'single',
        options: [
          { key: 'medium', label: 'Medium Home Kitchen', isDefault: true },
          { key: 'large', label: 'Large Modular Kitchen' },
          { key: 'commercial', label: 'Commercial / Hotel Restaurant Kitchen' }
        ]
      }
    ],
    matrix: [
      { selection: { size: 'medium' }, price: 1499, mrp: 1899, duration: '2 hrs' },
      { selection: { size: 'large' }, price: 2499, mrp: 2999, duration: '3 hrs' },
      { selection: { size: 'commercial' }, price: 4999, mrp: 5999, duration: '4-5 hrs' }
    ]
  },
  {
    _id: 's_sofa',
    title: 'Sofa Dry Cleaning & Shampooing',
    slug: 'sofa-dry-cleaning',
    aliases: [
      'service_sofa-drycleaning-per-seat',
      'service_7-seater',
      'service_9-seater',
      'service_12-seater'
    ],
    categoryName: 'Sofa & Carpet Cleaning',
    categorySlug: 'sofa-carpet-cleaning',
    icon: 'Armchair',
    price: 299,
    mrp: 399,
    duration: '1.5 hrs',
    isPopular: true,
    sortOrder: 4,
    moradabadOnly: false,
    cityAvailability: ['moradabad', 'rampur', 'amroha', 'gajraula', 'sambhal', 'chandausi', 'noorpur', 'dhampur', 'bijnor', 'kanth'],
    shortDescription: 'Injection-extraction shampooing and stain removal for fabric and leather sofas.',
    description: 'Breathe new life into your sofas. Dual-motor suction removes deep dust mites, food spills, and odor, leaving fabric fresh and dry within 3 hours.',
    media: { hero: { url: '/media/services/sofa-dry-cleaning.jpg', alt: 'Sofa dry cleaning worker with vacuum' } },
    inclusions: [
      'Dry vacuuming to extract dust mites and allergens',
      'Foam shampooing with soft bristle orbital tool',
      'Stain spot treatment on armrests and cushions',
      'High-power moisture suction for quick drying'
    ],
    optionGroups: [
      {
        key: 'seats',
        label: 'Seating Configuration',
        type: 'single',
        options: [
          { key: 'per-seat', label: 'Per Seat (Custom)', isDefault: true },
          { key: '5-seater', label: '5-Seater Set (3+1+1 or L-shape)' },
          { key: '7-seater', label: '7-Seater Set' },
          { key: '9-seater', label: '9-Seater Set' },
          { key: '12-seater', label: '12-Seater Set' }
        ]
      }
    ],
    matrix: [
      { selection: { seats: 'per-seat' }, price: 299, mrp: 399, duration: '30 mins' },
      { selection: { seats: '5-seater' }, price: 1299, mrp: 1699, duration: '1.5 hrs' },
      { selection: { seats: '7-seater' }, price: 1699, mrp: 2199, duration: '2 hrs' },
      { selection: { seats: '9-seater' }, price: 2199, mrp: 2799, duration: '2.5 hrs' },
      { selection: { seats: '12-seater' }, price: 2899, mrp: 3699, duration: '3 hrs' }
    ]
  },
  {
    _id: 's_carpet',
    title: 'Carpet Deep Cleaning',
    slug: 'carpet-cleaning',
    aliases: [
      'service_carpet-cleaning',
      'service_medium-carpet-50-100-sq-ft',
      'service_large-carpet-100-150-sq-ft',
      'service_extra-large-carpet-150-200-sq-ft'
    ],
    categoryName: 'Sofa & Carpet Cleaning',
    categorySlug: 'sofa-carpet-cleaning',
    icon: 'Sparkles',
    pricingType: 'unit',
    pricingUnit: 'sq_ft',
    unitLabel: 'Sq. Ft.',
    minUnitQuantity: 50,
    unitRateMoradabad: 30,
    unitRateOther: 30,
    price: 30,
    mrp: 40,
    duration: '1 hr',
    isPopular: true,
    sortOrder: 5,
    moradabadOnly: false,
    cityAvailability: ['moradabad', 'rampur', 'amroha', 'gajraula', 'sambhal', 'chandausi', 'noorpur', 'dhampur', 'bijnor', 'kanth'],
    shortDescription: 'Professional carpet deep cleaning at ₹30 per square foot.',
    description: 'Carpet cleaning services: ₹30 per square foot. High-temperature hot water extraction and specialized foam shampooing removes dirt, dust mites, spill stains, and odors from woollen, Persian, and synthetic rugs.',
    media: { hero: { url: '/media/categories/sofa-carpet-cleaning.jpg', alt: 'Carpet cleaning in progress' } },
    inclusions: [
      'High-power vacuuming of embedded grit',
      'Color-safe rotary foam scrub',
      'Spot treatment for coffee/tea spills',
      'Odor disinfectant misting'
    ],
    optionGroups: [],
    matrix: []
  },
  {
    _id: 's_swimming_pool',
    title: 'Swimming Pool Cleaning',
    slug: 'swimming-pool-cleaning',
    aliases: [
      'service_swimming-pool-cleaning',
      'swimming-pool-cleaning'
    ],
    categoryName: 'Commercial Cleaning',
    categorySlug: 'commercial-cleaning',
    icon: 'Waves',
    pricingType: 'unit',
    pricingUnit: 'litre',
    unitLabel: 'Litres',
    minUnitQuantity: 1000,
    unitRateMoradabad: 0.05,
    unitRateOther: 0.10,
    price: 0.05,
    mrp: 0.08,
    hasCitySpecificRates: true,
    duration: '3-6 hrs',
    isPopular: false,
    sortOrder: 14,
    moradabadOnly: false,
    cityAvailability: ['moradabad', 'rampur', 'amroha', 'gajraula', 'sambhal', 'chandausi', 'noorpur', 'dhampur', 'bijnor', 'kanth'],
    shortDescription: 'Professional swimming pool cleaning: ₹0.05/L in Moradabad, ₹0.10/L in other cities.',
    description: 'Professional swimming pool cleaning and water clarity management. Pricing: ₹0.05 per litre in Moradabad, ₹0.10 per litre in other cities. Algae brushing, submersible vacuuming, sand filter backwash, and chlorine shock balancing.',
    media: { hero: { url: '/media/categories/commercial-cleaning.jpg', alt: 'Swimming pool cleaning' } },
    inclusions: [
      'Surface leaf and debris netting',
      'Mechanical wall and tile line scrub to eliminate algae spores',
      'Underwater sediment and silt vacuuming',
      'Filter backwash and rinse cycle',
      'Chemical testing and chlorine balance dosing'
    ],
    optionGroups: [],
    matrix: []
  },
  {
    _id: 's_bed',
    title: 'Bed Mattress Dry Cleaning',
    slug: 'bed-dry-cleaning',
    aliases: [
      'service_single-bed-dry-cleaning',
      'service_double-bed-dry-cleaning'
    ],
    categoryName: 'Home Cleaning',
    categorySlug: 'home-deep-cleaning',
    icon: 'Bed',
    price: 799,
    mrp: 999,
    duration: '1 hr',
    isPopular: false,
    sortOrder: 6,
    shortDescription: 'Mattress sanitisation, dust mite removal, and organic stain extraction.',
    description: 'UV disinfection and hot water extraction for clean, germ-free sleeping surfaces.',
    media: { hero: { url: '/media/categories/home-deep-cleaning.jpg', alt: 'Bed mattress dry cleaning' } },
    inclusions: [
      'Double-sided deep vibration vacuuming',
      'Allergen & sweat stain neutralisation',
      'Anti-microbial spray treatment'
    ],
    optionGroups: [
      {
        key: 'size',
        label: 'Bed Size',
        type: 'single',
        options: [
          { key: 'single', label: 'Single Bed Mattress', isDefault: true },
          { key: 'double', label: 'Double / King / Queen Mattress' }
        ]
      }
    ],
    matrix: [
      { selection: { size: 'single' }, price: 799, mrp: 999, duration: '45 mins' },
      { selection: { size: 'double' }, price: 1299, mrp: 1599, duration: '1.5 hrs' }
    ]
  },
  {
    _id: 's_tank',
    title: 'Water Tank Cleaning',
    slug: 'water-tank-cleaning',
    aliases: [
      'service_water-tank-cleaning-700l-tank',
      'service_water-tank-cleaning-1000l-tank',
      'service_water-tank-cleaning-1500l-tank',
      'service_water-tank-cleaning-2000l-tank'
    ],
    categoryName: 'Home Cleaning',
    categorySlug: 'home-deep-cleaning',
    icon: 'Waves',
    price: 799,
    mrp: 999,
    duration: '1.5 hrs',
    isPopular: false,
    sortOrder: 7,
    shortDescription: '6-stage mechanised water tank cleaning with sludge pump and UV antibacterial treatment.',
    description: 'Safe drinking water guaranteed. Complete desilting, high-pressure rotary jetting, vacuum de-sludging, and UV disinfection.',
    media: { hero: { url: '/media/site/hero-clean-home.jpg', alt: 'Water tank cleaning' } },
    inclusions: [
      'Mechanised de-watering & sludge extraction',
      'High-pressure rotary wall jet wash',
      'Vacuum bottom sediment removal',
      'UV radiator antibacterial treatment'
    ],
    optionGroups: [
      {
        key: 'capacity',
        label: 'Tank Capacity',
        type: 'single',
        options: [
          { key: '700l', label: '700 Litres', isDefault: true },
          { key: '1000l', label: '1,000 Litres' },
          { key: '1500l', label: '1,500 Litres' },
          { key: '2000l', label: '2,000 Litres' },
          { key: '3000l', label: '3,000 Litres' },
          { key: '5000l', label: '5,000 Litres' }
        ]
      }
    ],
    matrix: [
      { selection: { capacity: '700l' }, price: 799, mrp: 999, duration: '1 hr' },
      { selection: { capacity: '1000l' }, price: 999, mrp: 1299, duration: '1 hr' },
      { selection: { capacity: '1500l' }, price: 1299, mrp: 1599, duration: '1.5 hrs' },
      { selection: { capacity: '2000l' }, price: 1599, mrp: 1999, duration: '1.5 hrs' },
      { selection: { capacity: '3000l' }, price: 2199, mrp: 2699, duration: '2 hrs' },
      { selection: { capacity: '5000l' }, price: 3299, mrp: 3999, duration: '2.5 hrs' }
    ]
  },
  {
    _id: 's_chair',
    title: 'Office & Dining Chair Dry Cleaning',
    slug: 'chair-dry-cleaning',
    aliases: [
      'service_chair-dry-cleaning',
      'service_upto-6-chairs',
      'service_upto-9-chairs',
      'service_upto-12-chairs'
    ],
    categoryName: 'Sofa & Carpet Cleaning',
    categorySlug: 'sofa-carpet-cleaning',
    icon: 'Armchair',
    price: 799,
    mrp: 999,
    duration: '1 hr',
    isPopular: false,
    sortOrder: 8,
    moradabadOnly: false,
    cityAvailability: ['moradabad', 'rampur', 'amroha', 'gajraula', 'sambhal', 'chandausi', 'noorpur', 'dhampur', 'bijnor', 'kanth'],
    shortDescription: 'Shampooing and stain removal for cushioned dining and office revolving chairs.',
    description: 'Remove sweat, ink, and coffee marks from conference and dining chairs with rapid foam extraction.',
    media: { hero: { url: '/media/categories/sofa-carpet-cleaning.jpg', alt: 'Chair dry cleaning' } },
    inclusions: [
      'Dry vacuuming of fabric cushioning',
      'Foam shampoo scrub and stain removal',
      'Base wheel and armrest wipe'
    ],
    optionGroups: [
      {
        key: 'count',
        label: 'Chair Quantity',
        type: 'single',
        options: [
          { key: '6-chairs', label: 'Up to 6 Chairs', isDefault: true },
          { key: '9-chairs', label: 'Up to 9 Chairs' },
          { key: '12-chairs', label: 'Up to 12 Chairs' }
        ]
      }
    ],
    matrix: [
      { selection: { count: '6-chairs' }, price: 799, mrp: 999, duration: '45 mins' },
      { selection: { count: '9-chairs' }, price: 1199, mrp: 1499, duration: '1 hr' },
      { selection: { count: '12-chairs' }, price: 1499, mrp: 1899, duration: '1.5 hrs' }
    ]
  },
  {
    _id: 's_commercial',
    title: 'Commercial Office Housekeeping',
    slug: 'commercial-office-cleaning',
    aliases: [
      'commercial-cleaning',
      'service_commercial-cleaning'
    ],
    categoryName: 'Commercial Cleaning',
    categorySlug: 'commercial-cleaning',
    icon: 'Building',
    price: 4999,
    mrp: 6499,
    duration: '4-6 hrs',
    isPopular: false,
    sortOrder: 9,
    shortDescription: 'Comprehensive deep cleaning for banks, retail showrooms, gyms, and corporate offices.',
    description: 'Trusted by leading institutions across Moradabad and Western UP. Tailored corporate sanitation protocols.',
    media: { hero: { url: '/media/categories/commercial-cleaning.jpg', alt: 'Commercial office housekeeping' } },
    inclusions: [
      'Workstation, keyboard, and cabin glass sanitisation',
      'Commercial carpet rotary scrubbing and stain extraction',
      'Restroom deep acid-free descaling and urinal hygiene',
      'Pantry, cafeteria slab, and waste management area sanitisation'
    ],
    optionGroups: [
      {
        key: 'area',
        label: 'Office Carpet Area',
        type: 'single',
        options: [
          { key: 'upto-1000', label: 'Up to 1,000 sq ft', isDefault: true },
          { key: 'upto-2500', label: '1,000 to 2,500 sq ft' },
          { key: 'upto-5000', label: '2,500 to 5,000 sq ft' }
        ]
      }
    ],
    matrix: [
      { selection: { area: 'upto-1000' }, price: 4999, mrp: 6499, duration: '3-4 hrs' },
      { selection: { area: 'upto-2500' }, price: 8999, mrp: 11999, duration: '5-6 hrs' },
      { selection: { area: 'upto-5000' }, price: 15999, mrp: 19999, duration: '7-8 hrs' }
    ]
  }
];

// Helper to calculate fallback quote if /bookings/quote fails
export function calculateFallbackQuote(items = []) {
  const quoteItems = items.map((it) => {
    const srv = FALLBACK_SERVICES.find(s => s._id === it.serviceId || s.slug === it.serviceId) || {
      title: 'Service Booking',
      price: 999,
      mrp: 1299
    };
    const qty = it.qty || 1;
    const unitPrice = srv.price || 999;
    const unitMrp = srv.mrp || unitPrice;
    return {
      serviceId: it.serviceId,
      title: srv.title,
      unitPrice,
      unitMrp,
      totalPrice: unitPrice * qty,
      totalMrp: unitMrp * qty,
      qty,
      savings: Math.max(0, unitMrp - unitPrice) * qty,
      discountPct: unitMrp > 0 ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0
    };
  });

  const subtotal = quoteItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const mrpTotal = quoteItems.reduce((acc, i) => acc + i.totalMrp, 0);

  return {
    success: true,
    quote: {
      items: quoteItems,
      totals: {
        subtotal,
        mrpTotal,
        discount: mrpTotal - subtotal,
        couponDiscount: 0,
        total: subtotal,
        customerSaved: mrpTotal - subtotal,
        overallDiscountPct: mrpTotal > 0 ? Math.round(((mrpTotal - subtotal) / mrpTotal) * 100) : 0
      }
    }
  };
}

// Fallback response provider: Returns empty collections when server is not connected
export function getFallbackResponse(url, options = {}) {
  const [pathPart] = url.split('?');
  const cleanPath = pathPart.toLowerCase().replace(/^\/api\/v1/, '').replace(/^\//, '/');

  if (cleanPath === '/categories' || cleanPath === '/admin/categories') {
    return { success: true, count: FALLBACK_CATEGORIES.length, categories: FALLBACK_CATEGORIES };
  }

  if (cleanPath === '/locations/cities') {
    return { success: false, cities: [], count: 0 };
  }

  if (cleanPath === '/public/brands') {
    return { success: false, brands: [] };
  }

  if (cleanPath === '/public/testimonials') {
    return { success: false, testimonials: [] };
  }

  if (cleanPath === '/admin/stats') {
    return { success: false, stats: { totalBookings: 0, pendingBookings: 0, totalRevenue: 0, totalCustomerSavings: 0 } };
  }

  if (cleanPath === '/services' || cleanPath === '/admin/services') {
    return { success: false, services: [], count: 0 };
  }

  if (cleanPath === '/admin/cities') {
    return { success: false, cities: [] };
  }

  if (cleanPath === '/admin/testimonials') {
    return { success: false, testimonials: [] };
  }

  if (cleanPath === '/admin/contact-messages') {
    return { success: false, messages: [] };
  }

  if (cleanPath === '/admin/bookings') {
    return { success: false, bookings: [] };
  }

  if (cleanPath === '/admin/users') {
    return { success: false, users: [] };
  }

  if (cleanPath.startsWith('/services/')) {
    return { success: false, service: null };
  }

  return null;
}

import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js';

// Proactively clear any legacy stale cached business settings from localStorage
try {
  clearCacheByPrefix('/public/settings');
  clearCacheByPrefix('/settings');
} catch {}

// Unified apiRequest helper powered by Axios with automatic graceful fallbacks and memory+localStorage caching
export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toLowerCase();
  const rawUrl = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = options.params ? `${rawUrl}_${JSON.stringify(options.params)}` : rawUrl;

  const isPrivateEndpoint = rawUrl.startsWith('/auth') || rawUrl.startsWith('/admin') || rawUrl.includes('/bookings/my') || rawUrl.includes('/messages') || rawUrl.includes('/settings');
  const canCache = method === 'get' && !options.noCache && !isPrivateEndpoint;

  // Check cache for public idempotent GET requests
  if (canCache) {
    const cached = getCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Prevent browser HTTP heuristic caching for noCache or settings requests
  const requestParams = { ...options.params };
  if (method === 'get' && (options.noCache || rawUrl.includes('/settings'))) {
    requestParams._t = Date.now();
  }

  try {
    const response = await api({
      url: rawUrl,
      method,
      data: options.body || options.data,
      headers: {
        ...(options.headers || {}),
        ...(options.noCache || rawUrl.includes('/settings') ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } : {})
      },
      params: requestParams
    });

    // Check if response is empty or unpopulated when expected
    if (response && response.success !== false) {
      // Save to cache memo & localStorage on successful public GET
      if (canCache) {
        setCache(cacheKey, response);
      } else if (method !== 'get') {
        // Invalidate cache on mutations
        if (rawUrl.includes('/services')) clearCacheByPrefix('/services');
        if (rawUrl.includes('/cities')) {
          clearCacheByPrefix('/locations/cities');
          clearCacheByPrefix('/admin/cities');
        }
        if (rawUrl.includes('/testimonials')) {
          clearCacheByPrefix('/public/testimonials');
          clearCacheByPrefix('/admin/testimonials');
        }
        if (rawUrl.includes('/users')) clearCacheByPrefix('/admin/users');
        if (rawUrl.includes('/settings')) {
          clearCacheByPrefix('/public/settings');
          clearCacheByPrefix('/settings');
          clearCacheByPrefix('/admin/settings');
        }
      }
      return response;
    }
    // If backend returned success: false on GET, try fallback
    if (method === 'get') {
      const fallback = getFallbackResponse(rawUrl, options);
      if (fallback) return fallback;
    }
    return response;
  } catch (error) {
    // If GET request failed due to server offline, network timeout or 404/500, activate fallback
    if (method === 'get' || rawUrl === '/bookings/quote') {
      const fallback = getFallbackResponse(rawUrl, options);
      if (fallback) {
        console.warn(`[Axios API Fallback] Serving response for ${rawUrl}:`, error.message);
        return fallback;
      }
    }
    throw error;
  }
}

// ========================================================
// STRUCTURED DOMAIN API SERVICE OBJECTS
// ========================================================

export const servicesAPI = {
  getAll: (params = {}) => apiRequest('/services', { method: 'GET', params }),
  getPopular: () => apiRequest('/services?popular=true', { method: 'GET' }),
  getByCategory: (categorySlug) => apiRequest(`/services?category=${categorySlug}`, { method: 'GET' }),
  getBySlug: (slug) => apiRequest(`/services/${slug}`, { method: 'GET' })
};

export const categoriesAPI = {
  getAll: () => apiRequest('/categories', { method: 'GET' })
};

export const locationsAPI = {
  getCities: () => apiRequest('/locations/cities', { method: 'GET' })
};

export const brandsAPI = {
  getAll: () => apiRequest('/public/brands', { method: 'GET' })
};

export const testimonialsAPI = {
  getAll: () => apiRequest('/public/testimonials', { method: 'GET' })
};

export const bookingsAPI = {
  create: (bookingData) => apiRequest('/bookings', { method: 'POST', body: bookingData }),
  createBooking: (data) => apiRequest('/bookings', { method: 'POST', body: data }),
  getMyBookings: () => apiRequest('/bookings/my', { method: 'GET' }),
  track: (code) => apiRequest(`/bookings/track/${encodeURIComponent(code)}`, { method: 'GET' }),
  trackBooking: (code) => apiRequest(`/bookings/track/${encodeURIComponent(code)}`, { method: 'GET' }),
  getQuote: (payloadOrItems, citySlug) => {
    if (citySlug !== undefined) {
      return apiRequest('/bookings/quote', { method: 'POST', body: { items: payloadOrItems, citySlug } });
    }
    return apiRequest('/bookings/quote', { method: 'POST', body: payloadOrItems });
  },
  update: (bookingId, data) => apiRequest(`/bookings/${bookingId}/edit`, { method: 'PUT', body: data }),
  editBooking: (id, data) => apiRequest(`/bookings/${id}/edit`, { method: 'PUT', body: data }),
  cancelBooking: (id, reason) => apiRequest(`/bookings/${id}/cancel`, { method: 'PUT', body: { reason } }),
  deleteBooking: (id) => apiRequest(`/bookings/${id}`, { method: 'DELETE' }),
  getMessages: (bookingId) => apiRequest(`/bookings/${bookingId}/messages`, { method: 'GET' }),
  sendMessage: (bookingId, text, senderName) => apiRequest(`/bookings/${bookingId}/messages`, { method: 'POST', body: { text, senderName } })
};

export const authAPI = {
  getMe: () => apiRequest('/auth/me', { method: 'GET' }),
  sendSignupOtp: (data) => apiRequest('/auth/signup-otp', { method: 'POST', body: data }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (identifier, password) => apiRequest('/auth/login', { method: 'POST', body: { identifier, password } }),
  requestOtp: (email) => apiRequest('/auth/request-otp', { method: 'POST', body: { email } }),
  verifyOtp: (payload) => apiRequest('/auth/verify-otp', { method: 'POST', body: payload }),
  googleLogin: (payload) => apiRequest('/auth/google', { method: 'POST', body: payload }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  addAddress: (addressData) => apiRequest('/auth/addresses', { method: 'POST', body: addressData }),
  updateAddress: (addressId, addressData) => apiRequest(`/auth/addresses/${addressId}`, { method: 'PUT', body: addressData }),
  setDefaultAddress: (addressId) => apiRequest(`/auth/addresses/${addressId}/default`, { method: 'PUT' }),
  deleteAddress: (addressId) => apiRequest(`/auth/addresses/${addressId}`, { method: 'DELETE' }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  changePassword: (payload) => apiRequest('/auth/change-password', { method: 'PUT', body: payload })
};

export const publicAPI = {
  submitContact: (data) => apiRequest('/public/contact', { method: 'POST', body: data }),
  getTestimonials: () => apiRequest('/public/testimonials', { method: 'GET' }),
  getBrands: () => apiRequest('/public/brands', { method: 'GET' }),
  getSettings: () => apiRequest('/public/settings', { method: 'GET' })
};

export const adminAPI = {
  getStats: () => apiRequest('/admin/stats', { method: 'GET' }),
  getBookings: (params = {}) => apiRequest('/admin/bookings', { method: 'GET', params }),
  getServices: () => apiRequest('/admin/services', { method: 'GET' }),
  updateBooking: (id, data) => apiRequest(`/admin/bookings/${id}`, { method: 'PUT', body: data }),
  deleteBooking: (id) => apiRequest(`/admin/bookings/${id}`, { method: 'DELETE' }),
  updateService: (id, data) => apiRequest(`/admin/services/${id}`, { method: 'PUT', body: data }),
  createService: (data) => apiRequest('/admin/services', { method: 'POST', body: data }),
  deleteService: (id) => apiRequest(`/admin/services/${id}`, { method: 'DELETE' }),
  // Categories management
  getCategories: () => apiRequest('/admin/categories', { method: 'GET' }),
  createCategory: (data) => apiRequest('/admin/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  // Cloudinary image upload
  uploadImage: async (file, folder = 'max-housekeeping/uploads') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post('/admin/upload', formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  uploadMultipleImages: async (files, folder = 'max-housekeeping/services') => {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    fileArray.forEach(file => formData.append('images', file));
    formData.append('folder', folder);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await api.post('/admin/upload-multiple', formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  deleteImage: (publicId) => apiRequest(`/admin/upload/${encodeURIComponent(publicId)}`, { method: 'DELETE' }),
  // Testimonials management
  getTestimonials: () => apiRequest('/admin/testimonials', { method: 'GET' }),
  createTestimonial: (data) => apiRequest('/admin/testimonials', { method: 'POST', body: data }),
  updateTestimonial: (id, data) => apiRequest(`/admin/testimonials/${id}`, { method: 'PUT', body: data }),
  deleteTestimonial: (id) => apiRequest(`/admin/testimonials/${id}`, { method: 'DELETE' }),
  // Contact messages
  getContactMessages: () => apiRequest('/admin/contact-messages', { method: 'GET' }),
  updateContactMessage: (id, data) => apiRequest(`/admin/contact-messages/${id}`, { method: 'PUT', body: data }),
  deleteContactMessage: (id) => apiRequest(`/admin/contact-messages/${id}`, { method: 'DELETE' }),
  // Cities management
  getCities: () => apiRequest('/admin/cities', { method: 'GET' }),
  createCity: (data) => apiRequest('/admin/cities', { method: 'POST', body: data }),
  updateCity: (id, data) => apiRequest(`/admin/cities/${id}`, { method: 'PUT', body: data }),
  deleteCity: (id) => apiRequest(`/admin/cities/${id}`, { method: 'DELETE' }),
  // Users Database management (MongoDB Atlas)
  getUsers: () => apiRequest('/admin/users', { method: 'GET' }),
  updateUserRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  // Coupons management
  getCoupons: () => apiRequest('/admin/coupons', { method: 'GET' }),
  createCoupon: (data) => apiRequest('/admin/coupons', { method: 'POST', body: data }),
  updateCoupon: (id, data) => apiRequest(`/admin/coupons/${id}`, { method: 'PUT', body: data }),
  deleteCoupon: (id) => apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' }),
  // Site & Business Settings
  getSettings: () => apiRequest('/admin/settings', { method: 'GET', noCache: true }),
  updateSettings: async (data) => {
    clearCacheByPrefix('/public/settings');
    clearCacheByPrefix('/settings');
    clearCacheByPrefix('/admin/settings');
    const res = await apiRequest('/admin/settings', { method: 'PUT', body: data });
    clearCacheByPrefix('/public/settings');
    clearCacheByPrefix('/settings');
    clearCacheByPrefix('/admin/settings');
    try {
      localStorage.setItem('max_settings_updated_at', Date.now().toString());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('max_settings_updated', { detail: res }));
      }
    } catch {}
    return res;
  }
};

// Export api Axios instance as default for direct use if desired
export default apiRequest;
