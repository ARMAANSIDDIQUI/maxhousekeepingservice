import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import City from '../src/models/City.js';
import Service from '../src/models/Service.js';
import Brand from '../src/models/Brand.js';
import Testimonial from '../src/models/Testimonial.js';
import Coupon from '../src/models/Coupon.js';
import Settings from '../src/models/Settings.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maxhousekeeping';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Clear existing collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await City.deleteMany({});
    await Service.deleteMany({});
    await Brand.deleteMany({});
    await Testimonial.deleteMany({});
    await Coupon.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Seed Categories
    const categoriesData = [
      {
        name: 'Home Cleaning',
        slug: 'home-deep-cleaning',
        description: 'Complete room-by-room deep scrubbing, floor machine buffing, and high-touch surface sanitisation.',
        iconKey: 'PiHouseLine',
        image: { url: '/media/categories/home-deep-cleaning.jpg', alt: 'Home deep cleaning' },
        sortOrder: 1
      },
      {
        name: 'Bathroom Cleaning',
        slug: 'bathroom-cleaning',
        description: 'Hard water tile descaling, acid-free fixture polishing, and anti-bacterial grouting scrub.',
        iconKey: 'PiBathtub',
        image: { url: '/media/categories/bathroom-cleaning.jpg', alt: 'Bathroom tile cleaning' },
        sortOrder: 2
      },
      {
        name: 'Kitchen Cleaning',
        slug: 'kitchen-cleaning',
        description: 'Heavy grease extraction, chimney degreasing, slab scrubbing, and appliance exterior detailing.',
        iconKey: 'PiCookingPot',
        image: { url: '/media/categories/kitchen-cleaning.jpg', alt: 'Kitchen deep cleaning' },
        sortOrder: 3
      },
      {
        name: 'Sofa & Carpet Cleaning',
        slug: 'sofa-carpet-cleaning',
        description: 'Industrial wet-extraction shampooing, fabric stain treatment, and fast-drying upholstery care.',
        iconKey: 'PiArmchair',
        image: { url: '/media/categories/sofa-carpet-cleaning.jpg', alt: 'Sofa upholstery shampooing' },
        sortOrder: 4
      },
      {
        name: 'Commercial Cleaning',
        slug: 'commercial-cleaning',
        description: 'Corporate offices, retail outlets, banks, salons, and institutional facility housekeeping.',
        iconKey: 'PiBuildingOffice',
        image: { url: '/media/categories/commercial-cleaning.jpg', alt: 'Commercial office housekeeping' },
        sortOrder: 5
      },
      {
        name: 'Pest Control',
        slug: 'pest-control',
        description: 'Odorless herbal gel pest treatments and long-lasting pest management protection.',
        iconKey: 'PiBug',
        image: { url: '/media/categories/pest-control.jpg', alt: 'Pest control service' },
        sortOrder: 6
      }
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    insertedCategories.forEach(c => { catMap[c.slug] = c; });
    console.log(`Seeded ${insertedCategories.length} categories.`);

    // 2. Seed 9 Active Cities in Western Uttar Pradesh
    const citiesData = [
      {
        name: 'Moradabad',
        slug: 'moradabad',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.7733, 28.8386] },
        pincodes: ['244001', '244002', '244102', '244103', '244104'],
        serviceRadiusKm: 30,
        sortOrder: 1,
        status: 'active'
      },
      {
        name: 'Rampur',
        slug: 'rampur',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [79.0267, 28.8093] },
        pincodes: ['244901', '244924', '244927'],
        serviceRadiusKm: 25,
        sortOrder: 2,
        status: 'active'
      },
      {
        name: 'Amroha',
        slug: 'amroha',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.4674, 28.9044] },
        pincodes: ['244221', '244222', '244236'],
        serviceRadiusKm: 25,
        sortOrder: 3,
        status: 'active'
      },
      {
        name: 'Gajraula',
        slug: 'gajraula',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.2372, 28.8475] },
        pincodes: ['244235'],
        serviceRadiusKm: 20,
        sortOrder: 4,
        status: 'active'
      },
      {
        name: 'Sambhal',
        slug: 'sambhal',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.5714, 28.5835] },
        pincodes: ['244302', '244303'],
        serviceRadiusKm: 25,
        sortOrder: 5,
        status: 'active'
      },
      {
        name: 'Chandausi',
        slug: 'chandausi',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.7766, 28.4554] },
        pincodes: ['244412'],
        serviceRadiusKm: 20,
        sortOrder: 6,
        status: 'active'
      },
      {
        name: 'Noorpur',
        slug: 'noorpur',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.4069, 29.1557] },
        pincodes: ['246734'],
        serviceRadiusKm: 20,
        sortOrder: 7,
        status: 'active'
      },
      {
        name: 'Dhampur',
        slug: 'dhampur',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.5085, 29.3087] },
        pincodes: ['246761'],
        serviceRadiusKm: 20,
        sortOrder: 8,
        status: 'active'
      },
      {
        name: 'Bijnor',
        slug: 'bijnor',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.1358, 29.3724] },
        pincodes: ['246701', '246702'],
        serviceRadiusKm: 25,
        sortOrder: 9,
        status: 'active'
      }
    ];

    const insertedCities = await City.insertMany(citiesData);
    console.log(`Seeded ${insertedCities.length} cities.`);

    // 3. Seed 9 Consolidated Services with Dual-Pricing (MRP vs Offered Price) & Matrix Rows
    const servicesData = [
      {
        title: 'Full Home Deep Cleaning',
        slug: 'full-home-deep-cleaning',
        aliases: [
          'service_full-home-deep-cleaning-1-bhk',
          'service_full-home-deep-cleaning-2-bhk',
          'service_full-home-deep-cleaning-3-bhk',
          'service_full-home-deep-cleaning-4-bhk'
        ],
        category: catMap['home-deep-cleaning']._id,
        categorySlug: 'home-deep-cleaning',
        categoryName: 'Home Cleaning',
        shortDescription: 'Complete residential deep cleaning with floor scrubbing machines, bathroom tile descaling, and dusting.',
        description: 'Our signature whole-house treatment covers every corner of your home. Professional crew equipped with industrial single-disc floor scrubbers, wet extraction vacuums, and eco-friendly Taski chemicals.',
        duration: '4-5 hrs',
        price: 3499, // Offered Price for 1 BHK
        mrp: 3999,   // Shown Price (MRP) for 1 BHK
        isPopular: true,
        sortOrder: 1,
        media: {
          hero: { url: '/media/services/full-home-deep-cleaning.jpg', alt: 'Full home deep cleaning worker in uniform' }
        },
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
              { key: '2-bhk', label: '2 BHK', priceDelta: 1000, mrpDelta: 1500 },
              { key: '3-bhk', label: '3 BHK', priceDelta: 2000, mrpDelta: 3000 },
              { key: '4-bhk', label: '4 BHK', priceDelta: 3500, mrpDelta: 5000 },
              { key: 'villa', label: 'Villa / Kothi (5+ BHK)', priceDelta: 6500, mrpDelta: 9000 }
            ]
          }
        ],
        matrix: [
          { selection: { size: '1-bhk' }, price: 3499, mrp: 3999, duration: '3-4 hrs' },
          { selection: { size: '2-bhk' }, price: 4499, mrp: 5499, duration: '4-5 hrs' },
          { selection: { size: '3-bhk' }, price: 5499, mrp: 6999, duration: '5-6 hrs' },
          { selection: { size: '4-bhk' }, price: 6999, mrp: 8999, duration: '6-7 hrs' },
          { selection: { size: 'villa' }, price: 9999, mrp: 12999, duration: '7-8 hrs' }
        ]
      },
      {
        title: 'Bathroom Deep Cleaning',
        slug: 'bathroom-deep-cleaning',
        aliases: [
          'service_bathroom-tiles-cleaning-medium-size',
          'service_bathroom-tiles-cleaning-large-size',
          'service_medium-size-tile-wala',
          'service_large-size-tile-wala'
        ],
        category: catMap['bathroom-cleaning']._id,
        categorySlug: 'bathroom-cleaning',
        categoryName: 'Bathroom Cleaning',
        shortDescription: 'Deep tile descaling, hard water stain removal, taps polishing, and toilet sanitisation.',
        description: 'Remove stubborn yellow hard water scaling and soap scum without damaging your ceramic or marble tiles. Acid-free hospital-grade sanitisation.',
        duration: '1.5 hrs',
        price: 799,
        mrp: 999,
        isPopular: true,
        sortOrder: 2,
        media: {
          hero: { url: '/media/services/bathroom-tile-cleaning.jpg', alt: 'Bathroom tile cleaning worker in uniform' }
        },
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
        title: 'Kitchen Deep Cleaning',
        slug: 'kitchen-deep-cleaning',
        aliases: [
          'service_kitchen-deep-cleaning-medium-size-kitchen',
          'service_kitchen-deep-cleaning-big-size-kitchen',
          'service_kitchen-deep-cleaning-big-size-hotel-kitchen'
        ],
        category: catMap['kitchen-cleaning']._id,
        categorySlug: 'kitchen-cleaning',
        categoryName: 'Kitchen Cleaning',
        shortDescription: 'Intense grease degreasing, chimney filter cleaning, gas stove and tile scrubbing.',
        description: 'Eliminates sticky cooking oil layers from kitchen walls, slabs, exhaust fans, and cabinet shutters with food-safe degreasers.',
        duration: '2.5 hrs',
        price: 1499,
        mrp: 1899,
        isPopular: true,
        sortOrder: 3,
        media: {
          hero: { url: '/media/services/kitchen-deep-cleaning.jpg', alt: 'Kitchen deep cleaning worker in uniform' }
        },
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
        title: 'Sofa Dry Cleaning & Shampooing',
        slug: 'sofa-dry-cleaning',
        aliases: [
          'service_sofa-drycleaning-per-seat',
          'service_7-seater',
          'service_9-seater',
          'service_12-seater'
        ],
        category: catMap['sofa-carpet-cleaning']._id,
        categorySlug: 'sofa-carpet-cleaning',
        categoryName: 'Sofa & Carpet Cleaning',
        shortDescription: 'Injection-extraction shampooing and stain removal for fabric and leather sofas.',
        description: 'Breathe new life into your sofas. Dual-motor suction removes deep dust mites, food spills, and odor, leaving fabric fresh and dry within 3 hours.',
        duration: '1.5 hrs',
        price: 299, // Per seat base
        mrp: 399,
        isPopular: true,
        sortOrder: 4,
        media: {
          hero: { url: '/media/services/sofa-dry-cleaning.jpg', alt: 'Sofa dry cleaning worker with vacuum' }
        },
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
        title: 'Carpet Deep Cleaning',
        slug: 'carpet-cleaning',
        aliases: [
          'service_carpet-cleaning',
          'service_medium-carpet-50-100-sq-ft',
          'service_large-carpet-100-150-sq-ft',
          'service_extra-large-carpet-150-200-sq-ft'
        ],
        category: catMap['sofa-carpet-cleaning']._id,
        categorySlug: 'sofa-carpet-cleaning',
        categoryName: 'Sofa & Carpet Cleaning',
        shortDescription: 'Industrial rotary shampooing and fiber sanitisation for living room rugs and carpets.',
        description: 'Gentle on fine wool and silk fibers, tough on ground-in dirt. Restores original texture and color vibrancy.',
        duration: '1 hr',
        price: 699,
        mrp: 899,
        sortOrder: 5,
        media: {
          hero: { url: '/media/categories/sofa-carpet-cleaning.jpg', alt: 'Carpet cleaning in progress' }
        },
        inclusions: [
          'High-power vacuuming of embedded grit',
          'Color-safe rotary foam scrub',
          'Spot treatment for coffee/tea spills',
          'Odor disinfectant misting'
        ],
        optionGroups: [
          {
            key: 'size',
            label: 'Carpet Size',
            type: 'single',
            options: [
              { key: 'medium', label: 'Medium (50 – 100 sq ft)', isDefault: true },
              { key: 'large', label: 'Large (100 – 150 sq ft)' },
              { key: 'extra-large', label: 'Extra Large (150 – 200 sq ft)' }
            ]
          }
        ],
        matrix: [
          { selection: { size: 'medium' }, price: 699, mrp: 899, duration: '45 mins' },
          { selection: { size: 'large' }, price: 999, mrp: 1299, duration: '1 hr' },
          { selection: { size: 'extra-large' }, price: 1499, mrp: 1899, duration: '1.5 hrs' }
        ]
      },
      {
        title: 'Bed Mattress Dry Cleaning',
        slug: 'bed-dry-cleaning',
        aliases: [
          'service_single-bed-dry-cleaning',
          'service_double-bed-dry-cleaning'
        ],
        category: catMap['home-deep-cleaning']._id,
        categorySlug: 'home-deep-cleaning',
        categoryName: 'Home Cleaning',
        shortDescription: 'Mattress sanitisation, dust mite removal, and organic stain extraction.',
        description: 'UV disinfection and hot water extraction for clean, germ-free sleeping surfaces.',
        duration: '1 hr',
        price: 799,
        mrp: 999,
        sortOrder: 6,
        media: {
          hero: { url: '/media/categories/home-deep-cleaning.jpg', alt: 'Bed mattress dry cleaning' }
        },
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
        title: 'Water Tank Cleaning',
        slug: 'water-tank-cleaning',
        aliases: [
          'service_water-tank-cleaning-700l-tank',
          'service_water-tank-cleaning-1000l-tank',
          'service_water-tank-cleaning-1500l-tank',
          'service_water-tank-cleaning-2000l-tank',
          'service_water-tank-cleaning-3000l-tank',
          'service_water-tank-cleaning-5000l-tank',
          'service_upto-5000-litre',
          'service_upto-10000-litre',
          'service_upto-15000-litre',
          'service_upto-20000-litre'
        ],
        category: catMap['home-deep-cleaning']._id,
        categorySlug: 'home-deep-cleaning',
        categoryName: 'Home Cleaning',
        shortDescription: '6-stage mechanised water tank cleaning with sludge pump and UV antibacterial treatment.',
        description: 'Safe drinking water guaranteed. Complete desilting, high-pressure rotary jetting, vacuum de-sludging, and UV disinfection for overhead and underground tanks.',
        duration: '1.5 hrs',
        price: 799,
        mrp: 999,
        sortOrder: 7,
        media: {
          hero: { url: '/media/site/hero-clean-home.jpg', alt: 'Water tank cleaning' }
        },
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
              { key: '5000l', label: '5,000 Litres' },
              { key: '10000l', label: 'Up to 10,000 Litres (Society / Commercial)' }
            ]
          }
        ],
        matrix: [
          { selection: { capacity: '700l' }, price: 799, mrp: 999, duration: '1 hr' },
          { selection: { capacity: '1000l' }, price: 999, mrp: 1299, duration: '1 hr' },
          { selection: { capacity: '1500l' }, price: 1299, mrp: 1599, duration: '1.5 hrs' },
          { selection: { capacity: '2000l' }, price: 1599, mrp: 1999, duration: '1.5 hrs' },
          { selection: { capacity: '3000l' }, price: 2199, mrp: 2699, duration: '2 hrs' },
          { selection: { capacity: '5000l' }, price: 3299, mrp: 3999, duration: '2.5 hrs' },
          { selection: { capacity: '10000l' }, price: 5499, mrp: 6499, duration: '3.5 hrs' }
        ]
      },
      {
        title: 'Office & Dining Chair Dry Cleaning',
        slug: 'chair-dry-cleaning',
        aliases: [
          'service_chair-dry-cleaning',
          'service_upto-6-chairs',
          'service_upto-9-chairs',
          'service_upto-12-chairs'
        ],
        category: catMap['sofa-carpet-cleaning']._id,
        categorySlug: 'sofa-carpet-cleaning',
        categoryName: 'Sofa & Carpet Cleaning',
        shortDescription: 'Shampooing and stain removal for cushioned dining and office revolving chairs.',
        description: 'Remove sweat, ink, and coffee marks from conference and dining chairs with rapid foam extraction.',
        duration: '1 hr',
        price: 799,
        mrp: 999,
        sortOrder: 8,
        media: {
          hero: { url: '/media/categories/sofa-carpet-cleaning.jpg', alt: 'Chair dry cleaning' }
        },
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
        title: 'Commercial Office Housekeeping',
        slug: 'commercial-office-cleaning',
        aliases: [
          'commercial-cleaning',
          'corporate-cleaning'
        ],
        category: catMap['commercial-cleaning']._id,
        categorySlug: 'commercial-cleaning',
        categoryName: 'Commercial Cleaning',
        shortDescription: 'Comprehensive deep cleaning for banks, retail showrooms, gyms, clinics, and workspaces.',
        description: 'Trusted by leading institutions across Moradabad and Western UP including Bank of Baroda, Geetanjali Salon, Tanishq, and Subway.',
        duration: '4-6 hrs',
        price: 4999,
        mrp: 6499,
        isPopular: true,
        sortOrder: 9,
        media: {
          hero: { url: '/media/categories/commercial-cleaning.jpg', alt: 'Commercial office housekeeping team' }
        },
        inclusions: [
          'Workstation desks and partitions sanitisation',
          'Heavy-traffic carpet vacuuming and tile scrubbing',
          'Staff pantry and cafeteria degreasing',
          'Restroom high-frequency disinfection'
        ],
        optionGroups: [
          {
            key: 'area',
            label: 'Commercial Area',
            type: 'single',
            options: [
              { key: 'upto-1000', label: 'Up to 1,000 sq ft', isDefault: true },
              { key: 'upto-2500', label: '1,000 – 2,500 sq ft' },
              { key: 'upto-5000', label: '2,500 – 5,000 sq ft' }
            ]
          }
        ],
        matrix: [
          { selection: { area: 'upto-1000' }, price: 4999, mrp: 6499, duration: '3-4 hrs' },
          { selection: { area: 'upto-2500' }, price: 8999, mrp: 11999, duration: '5-6 hrs' },
          { selection: { area: 'upto-5000' }, price: 15999, mrp: 19999, duration: 'Full Day' }
        ]
      }
    ];

    const insertedServices = await Service.insertMany(servicesData);
    console.log(`Seeded ${insertedServices.length} consolidated services with dual-pricing and matrices.`);

    // 4. Seed 15 Corporate Brand Partners
    const brandsData = [
      { name: 'Bank Of Baroda', logoUrl: '/brands/bank-of-baroda.jpg', sortOrder: 1 },
      { name: 'Geetanjali Salon', logoUrl: '/brands/geetanjali-salon.jpg', sortOrder: 2 },
      { name: 'Kundans', logoUrl: '/brands/kundans.jpg', sortOrder: 3 },
      { name: 'Redtape', logoUrl: '/brands/redtape.jpg', sortOrder: 4 },
      { name: 'Punjab National Bank', logoUrl: '/brands/punjab-national-bank.jpg', sortOrder: 5 },
      { name: 'Subway', logoUrl: '/brands/subway.jpg', sortOrder: 6 },
      { name: 'Temptations', logoUrl: '/brands/temptations.jpg', sortOrder: 7 },
      { name: 'V-Mart', logoUrl: '/brands/v-mart.jpg', sortOrder: 8 },
      { name: 'Tanishq', logoUrl: '/brands/tanishq.jpg', sortOrder: 9 },
      { name: 'Metro', logoUrl: '/brands/metro.jpg', sortOrder: 10 },
      { name: 'Bikanervala', logoUrl: '/brands/bikanervala.jpg', sortOrder: 11 },
      { name: 'Gajraula Haveli', logoUrl: '/brands/gajraula.jpg', sortOrder: 12 },
      { name: 'Gold\'s Gym', logoUrl: '/brands/goldgym.jpg', sortOrder: 13 },
      { name: 'Mooga', logoUrl: '/brands/mooga.jpg', sortOrder: 14 },
      { name: 'NGM Group', logoUrl: '/brands/ngm.jpg', sortOrder: 15 }
    ];

    const insertedBrands = await Brand.insertMany(brandsData);
    console.log(`Seeded ${insertedBrands.length} partner brand logos.`);

    // 5. Seed Real Testimonials
    const testimonialsData = [
      {
        name: 'Dr. Alok Verma',
        role: 'Civil Lines Resident',
        city: 'Moradabad',
        quote: 'Booked Full Home Deep Cleaning before Diwali. The team arrived on time in clean uniforms, used heavy floor scrubbers, and took almost 6 hours to make the house spotless. Very impressed.',
        rating: 5,
        isActive: true
      },
      {
        name: 'Neha Singhal',
        role: 'Homeowner',
        city: 'Rampur',
        quote: 'Our sofa had coffee stains and dust from months. Their technician shampooed it thoroughly with a wet vacuum. By evening it was completely dry and looked brand new.',
        rating: 5,
        isActive: true
      },
      {
        name: 'Branch Operations Manager',
        role: 'Commercial Facility Lead',
        city: 'Moradabad',
        quote: 'Max Housekeeping handles the commercial cleaning for our branch floor and reception. Very reliable, professional staff, and transparent billing.',
        rating: 5,
        isActive: true
      },
      {
        name: 'Rajiv Sharma',
        role: 'Gandhi Nagar Resident',
        city: 'Amroha',
        quote: 'Excellent bathroom tile scaling removal. The yellow hard water stains on our bathroom walls are totally gone. Reasonable price and polite workers.',
        rating: 5,
        isActive: true
      }
    ];

    await Testimonial.insertMany(testimonialsData);
    console.log(`Seeded ${testimonialsData.length} testimonials.`);

    // 6. Seed Business Settings
    await Settings.create({
      businessName: 'Max Housekeeping Service',
      tagline: 'Housekeeping & Commercial Cleaning Experts',
      primaryPhone: '9897766002',
      secondaryPhone: '',
      supportEmail: 'contactmaxhousekeepingservice@gmail.com',
      headquarters: {
        address: 'Moradabad, Uttar Pradesh, India',
        city: 'Moradabad',
        state: 'Uttar Pradesh'
      },
      workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
      socialLinks: {
        whatsapp: '9897766002'
      }
    });
    console.log('Seeded business settings.');

    // 7. Seed Promotional Coupons
    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        description: '10% discount on first booking above ₹1,500',
        discountType: 'percentage',
        discountValue: 10,
        minBookingAmount: 1500,
        maxDiscount: 500,
        validUntil: new Date('2028-12-31')
      },
      {
        code: 'MAXFESTIVE',
        description: 'Flat ₹200 off on festive bookings above ₹2,000',
        discountType: 'flat',
        discountValue: 200,
        minBookingAmount: 2000,
        validUntil: new Date('2028-12-31')
      },
      {
        code: 'CLEANHOME',
        description: '15% discount for full home deep cleanings',
        discountType: 'percentage',
        discountValue: 15,
        minBookingAmount: 3000,
        maxDiscount: 1000,
        validUntil: new Date('2028-12-31')
      }
    ]);
    console.log('Seeded coupons.');

    // 8. Seed Default Admin User & Sample Customer
    const adminUser = new User({
      name: 'Max Housekeeping Admin',
      phone: '9897766002',
      email: 'admin@dummy.com',
      passwordHash: 'Admin@123456',
      role: 'admin',
      authProvider: 'local',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=10231D&textColor=E9A23B&radius=50'
    });
    await adminUser.save();

    const sampleCustomer = new User({
      name: 'Demo Customer',
      phone: '9876543210',
      email: 'customer@example.com',
      passwordHash: 'CustomerPass123!',
      role: 'customer',
      authProvider: 'local',
      emailVerified: true,
      avatarUrl: User.generateDefaultAvatar('Demo Customer'),
      addresses: [
        {
          label: 'Home',
          line1: 'House No. 42, Civil Lines',
          landmark: 'Near Company Bagh',
          city: 'Moradabad',
          state: 'Uttar Pradesh',
          pincode: '244001',
          isDefault: true
        },
        {
          label: 'Office',
          line1: 'Suite 302, Business Center, Delhi Road',
          city: 'Moradabad',
          state: 'Uttar Pradesh',
          pincode: '244001',
          isDefault: false
        }
      ]
    });
    await sampleCustomer.save();
    console.log('Seeded admin user and sample customer with saved addresses.');

    console.log('\n=== DATABASE SEEDING COMPLETED WITH ZERO ERRORS ===');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
