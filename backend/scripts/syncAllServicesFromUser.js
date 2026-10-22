import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Service from '../src/models/Service.js';
import Category from '../src/models/Category.js';
import City from '../src/models/City.js';

async function syncServices() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas.');

  // Fetch all categories to map IDs
  const allCategories = await Category.find();
  const catMap = new Map();
  allCategories.forEach(c => catMap.set(c.slug, c));

  const getCatDoc = (slug) => {
    const c = catMap.get(slug);
    if (!c) {
      console.warn(`Category slug "${slug}" not found in MongoDB`);
    }
    return c;
  };

  const rawServices = [
    // 1. Big kitchen deep cleaning
    {
      title: 'Big Kitchen Deep Cleaning',
      slug: 'big-kitchen-deep-cleaning',
      categorySlugs: ['kitchen-cleaning', 'home-deep-cleaning', 'pest-control'],
      price: 5000,
      mrp: 6500,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '4-5 hrs',
      icon: 'Sparkles',
      shortDescription: 'All cupboards deep clean, chimney, steel drawers, sink, tiles, marble slab, fans, refrigerator & complimentary pest control.',
      description: 'Comprehensive deep cleaning of large kitchens: All cupboards deep clean with Chimney and steel drawer sink tiles Marble slab fans refrigerator with cockroach & rats Pest Control treatment.',
      inclusions: [
        'All kitchen cupboards & overhead cabinets interior & exterior deep scrub',
        'Chimney degreasing, baffle filter bath & oil collector deep clean',
        'Modular steel drawer channels, wire baskets & runners descaling',
        'Kitchen sink, drainage trap & tile backsplash stain removal',
        'Marble / granite slab polishing, joint stain descaling',
        'Ceiling fan, exhaust fan & window mesh degreasing',
        'Refrigerator interior & exterior deep wipe',
        'Complimentary cockroach & rat pest control treatment'
      ]
    },

    // 2. Water tank cleaning Services
    {
      title: 'Water Tank Cleaning Services',
      slug: 'water-tank-cleaning',
      categorySlugs: ['home-deep-cleaning', 'commercial-cleaning'],
      price: 400,
      mrp: 499,
      pricingType: 'normal',
      pricingMode: 'tiered',
      duration: '1-2 hrs',
      icon: 'Droplets',
      videoUrl: 'https://youtu.be/yCkBXdzwjic',
      shortDescription: '6-stage mechanized scientific water tank cleaning: de-sludging, high-pressure rotary jet, UV sterilization.',
      description: 'Scientific 6-stage overhead & underground water tank cleaning: 500L Rs.400, 750L Rs.500, 1000L Rs.700, 1500L Rs.1000, 2000L Rs.1500, 3000L Rs.2000. Removes algae, sludge, and waterborne bacteria.',
      optionGroups: [
        {
          key: 'capacity',
          label: 'Tank Capacity',
          type: 'single',
          required: true,
          options: [
            { key: '500l', label: '500 Litre Tank', priceDelta: 0, mrpDelta: 0, isDefault: true },
            { key: '750l', label: '750 Litre Tank', priceDelta: 100, mrpDelta: 151 },
            { key: '1000l', label: '1,000 Litre Tank', priceDelta: 300, mrpDelta: 401 },
            { key: '1500l', label: '1,500 Litre Tank', priceDelta: 600, mrpDelta: 801 },
            { key: '2000l', label: '2,000 Litre Tank', priceDelta: 1100, mrpDelta: 1401 },
            { key: '3000l', label: '3,000 Litre Tank', priceDelta: 1600, mrpDelta: 2001 }
          ]
        }
      ],
      matrix: [
        { selection: { capacity: '500l' }, price: 400, mrp: 499, duration: '45 mins' },
        { selection: { capacity: '750l' }, price: 500, mrp: 650, duration: '1 hr' },
        { selection: { capacity: '1000l' }, price: 700, mrp: 900, duration: '1 hr 15 mins' },
        { selection: { capacity: '1500l' }, price: 1000, mrp: 1300, duration: '1.5 hrs' },
        { selection: { capacity: '2000l' }, price: 1500, mrp: 1900, duration: '2 hrs' },
        { selection: { capacity: '3000l' }, price: 2000, mrp: 2500, duration: '2.5 hrs' }
      ]
    },

    // 3. Large size tiles Wala bathroom cleaning
    {
      title: 'Large Size Tiles Wala Bathroom Cleaning',
      slug: 'large-size-tiles-bathroom-cleaning',
      categorySlugs: ['bathroom-cleaning', 'home-deep-cleaning'],
      price: 700,
      mrp: 1000,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '1.5 hrs',
      icon: 'Sparkles',
      shortDescription: 'Specialized deep cleaning and descaling for large size tiled master bathrooms.',
      description: 'Expert cleaning and hard water descaling for large tile bathrooms: Full wall tiles, marble borders, sanitaryware polishing, mirror restoration, and exhaust fan degreasing.',
      inclusions: [
        'Large format tile wall and floor scrubbing with anti-limescale solution',
        'Shower cubicle / glass partition hard-water spot removal',
        'WC toilet bowl acid-free sanitization & descaling',
        'Washbasin, taps, diverters & chrome fittings buffing',
        'Exhaust fan, ceiling cobweb & drain cleaning'
      ]
    },

    // 4. Small kitchen cleaning flat ghar services
    {
      title: 'Small Kitchen Cleaning Flat Ghar Services',
      slug: 'small-kitchen-cleaning',
      categorySlugs: ['kitchen-cleaning', 'home-deep-cleaning'],
      price: 1000,
      mrp: 1500,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '1.5-2 hrs',
      icon: 'PiHouseLine',
      shortDescription: 'Compact flat & home kitchen deep cleaning (No chimney, no cupboards, no refrigerator).',
      description: 'Focused surface deep cleaning for small flat or household kitchens: Slabs, floor, wall tiles, exhaust fan, and sink cleaning. (No chimney, no inside cupboards, no refrigerator).',
      inclusions: [
        'Kitchen countertop & marble slab stain scrubbing',
        'Wall tiles grease and oil splatter removal',
        'Exhaust fan and switchboard degreasing',
        'Floor scrubbing and sink sanitization'
      ]
    },

    // 5. Medium size tile Wala bathroom cleaning
    {
      title: 'Medium Size Tile Wala Bathroom Cleaning',
      slug: 'medium-size-tile-bathroom-cleaning',
      categorySlugs: ['bathroom-cleaning', 'home-deep-cleaning'],
      price: 550,
      mrp: 700,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '1 hr',
      icon: 'Droplets',
      shortDescription: 'Deep scrubbing, tile joint grime cleaning, and disinfection for medium size tiled bathrooms.',
      description: 'Thorough chemical scrubbing and sanitaryware disinfection for medium-sized tiled washrooms. Removes soap scum, yellow stains, and floor grime.',
      inclusions: [
        'Wall tiles & floor tile scrubbing with rotary brush',
        'Toilet seat, lid & cistern deep descaling',
        'Washbasin and chrome CP tap fittings shine restoration',
        'Mirror and cabinet exterior wipe',
        'Exhaust and floor drain sanitization'
      ]
    },

    // 6. Home cleaning Services
    {
      title: 'Home Cleaning Services',
      slug: 'full-home-deep-cleaning',
      aliases: ['home-cleaning-services'],
      categorySlugs: ['home-deep-cleaning'],
      price: 4999,
      mrp: 5999,
      pricingType: 'normal',
      pricingMode: 'tiered',
      duration: '5-8 hrs',
      icon: 'PiHouseLine',
      shortDescription: 'Full home deep cleaning including all bathrooms and kitchen. 1 BHK to 5 BHK packages.',
      description: 'Full home cleaning services include both bathroom and kitchen cleaning. Moradabad only without sofa drycleaning. Custom square feet option available: Moradabad Rs.15/sq ft, Other cities Rs.25/sq ft.',
      optionGroups: [
        {
          key: 'size',
          label: 'House / Apartment Size',
          type: 'single',
          required: true,
          options: [
            { key: '1-bhk', label: '1 BHK Home Deep Cleaning', priceDelta: 0, mrpDelta: 0, isDefault: true },
            { key: '2-bhk', label: '2 BHK Home Deep Cleaning', priceDelta: 2501, mrpDelta: 3001 },
            { key: '3-bhk', label: '3 BHK Home Deep Cleaning', priceDelta: 5000, mrpDelta: 6001 },
            { key: '4-bhk', label: '4 BHK Home Deep Cleaning', priceDelta: 10000, mrpDelta: 12001 },
            { key: '5-bhk', label: '5 BHK Home Deep Cleaning', priceDelta: 12000, mrpDelta: 15001 }
          ]
        }
      ],
      matrix: [
        { selection: { size: '1-bhk' }, price: 4999, mrp: 5999, duration: '4-5 hrs' },
        { selection: { size: '2-bhk' }, price: 7500, mrp: 9000, duration: '5-6 hrs' },
        { selection: { size: '3-bhk' }, price: 9999, mrp: 12000, duration: '6-7 hrs' },
        { selection: { size: '4-bhk' }, price: 14999, mrp: 18000, duration: '7-8 hrs' },
        { selection: { size: '5-bhk' }, price: 16999, mrp: 21000, duration: '8-9 hrs' }
      ]
    },

    // 7. Fans cleaning services
    {
      title: 'Fans Cleaning Services',
      slug: 'fans-cleaning-services',
      categorySlugs: ['home-deep-cleaning'],
      price: 80,
      mrp: 100,
      pricingType: 'unit',
      pricingUnit: 'fan',
      unitRateMoradabad: 80,
      unitRateOther: 100,
      unitLabel: 'Fans',
      minUnitQuantity: 1,
      duration: '30 mins',
      icon: 'Sparkles',
      shortDescription: 'Professional fan blade degreasing, motor cap cleaning & polishing. ₹80 per fan.',
      description: 'Professional cleaning of ceiling fans, exhaust fans, and wall fans: Heavy grease, sticky dust, and carbon stain removal with high-grade cleaner.',
      inclusions: [
        'Fan blades degreasing and dry wipe',
        'Motor housing and canopy dusting',
        'Rod and hook safety check & wipe',
        'Exhaust fan mesh and louvre descaling'
      ]
    },

    // 8. Floor cleaning Rs.10 per square feet
    {
      title: 'Floor Cleaning (Rs. 10 Per Sq. Ft.)',
      slug: 'floor-cleaning',
      categorySlugs: ['home-deep-cleaning', 'commercial-cleaning'],
      price: 10,
      mrp: 15,
      pricingType: 'unit',
      pricingUnit: 'sq_ft',
      unitRateMoradabad: 10,
      unitRateOther: 15,
      unitLabel: 'Square Feet (sq ft)',
      minUnitQuantity: 100,
      duration: '2-4 hrs',
      icon: 'Sparkles',
      shortDescription: 'Single disc machine red pad scrubbing with genuine Diversey chemical. ₹10 per sq ft.',
      description: 'Single disc machine Red pad cleaning services using Diversey chemical. Deep cleans tiles, marble, granite, and mosaic floors. Removes cement residue, paint spots, and deep grout dirt.',
      inclusions: [
        'Single disc heavy rotary scrubbing machine with Red pad',
        'Diversey professional floor care chemical application',
        'Wet vacuum water extraction and dry buffing',
        'Skirting and corner manual detail brushing'
      ]
    },

    // 9. Medium Kitchen cleaning services
    {
      title: 'Medium Kitchen Cleaning Services',
      slug: 'medium-kitchen-cleaning',
      categorySlugs: ['kitchen-cleaning', 'home-deep-cleaning', 'pest-control'],
      price: 2500,
      mrp: 3200,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '2.5-3 hrs',
      icon: 'Sparkles',
      shortDescription: 'Kitchen cleaning with complimentary cockroach treatment. Cabinets, tiles & slabs.',
      description: 'Medium Kitchen cleaning services: Kitchen cleaning with pest control complimentary cockroach treatment. Slabs, tiles, outer cupboards, exhaust, and sink.',
      inclusions: [
        'Kitchen slabs, countertops & splashback deep scrub',
        'Outer cabinets, handles & shelves cleaning',
        'Exhaust fan and window grill degreasing',
        'Sink and drain trap disinfection',
        'Complimentary cockroach gel pest control application'
      ]
    },

    // 10. Swimming pool cleaning
    {
      title: 'Swimming Pool Cleaning',
      slug: 'swimming-pool-cleaning',
      categorySlugs: ['commercial-cleaning', 'home-deep-cleaning'],
      price: 0.05,
      mrp: 0.08,
      pricingType: 'unit',
      pricingUnit: 'litre',
      unitRateMoradabad: 0.05,
      unitRateOther: 0.10,
      unitLabel: 'Water Litres',
      minUnitQuantity: 10000,
      duration: '3-6 hrs',
      icon: 'Droplets',
      shortDescription: 'Professional swimming pool cleaning: Moradabad ₹0.05/L, other cities ₹0.10/L.',
      description: 'Swimming pool cleaning: Rs.0.05 per litre (Moradabad only). Other cities Rs.0.10 per litre. Algae brushing, leaf skimming, vacuum scrubbing, and water shock treatment.',
      inclusions: [
        'Under-water vacuum suction cleaning & debris filtration',
        'Pool tile algae scrubbing & waterline scum removal',
        'Skimmer baskets & hair-lint strainer cleaning',
        'Water balancing (pH, chlorine shock & clarity chemicals)'
      ]
    },

    // 11. Double bed mattress up drycleaning
    {
      title: 'Double Bed Mattress Up Drycleaning',
      slug: 'double-bed-mattress-up-drycleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'home-deep-cleaning'],
      price: 1000,
      mrp: 1300,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '1 hr',
      icon: 'Sparkles',
      shortDescription: 'Double bed mattress top-side deep dry cleaning & sanitization. (Backside ₹1,000 extra).',
      description: 'Double bed mattress up drycleaning: Top sleeping surface deep extraction, dust mite killing, and fabric shampooing. Backside 1000 extra pay only.',
      optionGroups: [
        {
          key: 'backside',
          label: 'Backside Mattress Cleaning',
          type: 'single',
          required: false,
          options: [
            { key: 'top-only', label: 'Top Side Only (Rs. 1,000)', priceDelta: 0, mrpDelta: 0, isDefault: true },
            { key: 'both-sides', label: 'Both Sides Top + Back (Rs. 1,000 Extra)', priceDelta: 1000, mrpDelta: 1000 }
          ]
        }
      ]
    },

    // 12. Fridge cleaning services
    {
      title: 'Fridge Cleaning Services',
      slug: 'fridge-cleaning',
      categorySlugs: ['kitchen-cleaning', 'home-deep-cleaning'],
      price: 500,
      mrp: 650,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '45 mins',
      icon: 'Sparkles',
      shortDescription: 'Complete refrigerator interior & exterior cleaning, defrosting & odor neutralizer.',
      description: 'Fridge cleaning services: Interior shelves, vegetable crispers, door gaskets, and exterior sanitization with food-safe antibacterial solution.',
      inclusions: [
        'Tray and shelf removal & individual hot water wash',
        'Rubber door gasket fungus & black mold removal',
        'Odor neutralizer and food-grade disinfectant wipe',
        'Exterior body, handle and top dust cleaning'
      ]
    },

    // 13. Tile wala Bathroom cleaning
    {
      title: 'Tile Wala Bathroom Cleaning',
      slug: 'tile-wala-bathroom-cleaning',
      categorySlugs: ['bathroom-cleaning', 'home-deep-cleaning'],
      price: 599,
      mrp: 750,
      pricingType: 'normal',
      pricingMode: 'tiered',
      duration: '1-1.5 hrs',
      icon: 'Droplets',
      shortDescription: 'Complete tile bathroom cleaning in 3 sizes: Small ₹499, Medium ₹599, Large ₹699.',
      description: 'Tile wala Bathroom cleaning: Small Rs.499, medium Rs.599, large Rs.699. Thorough tile descaling, toilet seat sanitization, tap shine, and mirror cleaning.',
      optionGroups: [
        {
          key: 'size',
          label: 'Bathroom Tile Size',
          type: 'single',
          required: true,
          options: [
            { key: 'small-tile', label: 'Small Bathroom (Rs. 499)', priceDelta: -100, mrpDelta: -150 },
            { key: 'medium-tile', label: 'Medium Bathroom (Rs. 599)', priceDelta: 0, mrpDelta: 0, isDefault: true },
            { key: 'large-tile', label: 'Large Bathroom (Rs. 699)', priceDelta: 100, mrpDelta: 150 }
          ]
        }
      ],
      matrix: [
        { selection: { size: 'small-tile' }, price: 499, mrp: 600, duration: '45 mins' },
        { selection: { size: 'medium-tile' }, price: 599, mrp: 750, duration: '1 hr' },
        { selection: { size: 'large-tile' }, price: 699, mrp: 900, duration: '1 hr 15 mins' }
      ]
    },

    // 14. Medium Double bedhead with bed drycleaning Service
    {
      title: 'Medium Double Bedhead with Bed Drycleaning Service',
      slug: 'medium-double-bedhead-bed-drycleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'home-deep-cleaning'],
      price: 1500,
      mrp: 2000,
      pricingType: 'normal',
      pricingMode: 'fixed',
      cityExtraCharge: 500,
      duration: '1.5 hrs',
      icon: 'Sparkles',
      shortDescription: 'Medium double bedhead with bed drycleaning (front only). Backside ₹1,000 extra. Other city ₹500 extra.',
      description: 'Medium Double bedhead with bed drycleaning Service: Front only. Backside Rs.1000 extra pay. Other city Rs.500 extra outstation charge.',
      optionGroups: [
        {
          key: 'backside',
          label: 'Backside Bedhead Cleaning',
          type: 'single',
          required: false,
          options: [
            { key: 'front-only', label: 'Front Only (Rs. 1,500)', priceDelta: 0, mrpDelta: 0, isDefault: true },
            { key: 'with-backside', label: 'Both Front & Back (Rs. 1,000 Extra)', priceDelta: 1000, mrpDelta: 1000 }
          ]
        }
      ]
    },

    // 15. Chimney cleaning services
    {
      title: 'Chimney Cleaning Services',
      slug: 'chimney-cleaning',
      categorySlugs: ['kitchen-cleaning'],
      price: 500,
      mrp: 650,
      pricingType: 'normal',
      pricingMode: 'tiered',
      duration: '1 hr',
      icon: 'Sparkles',
      shortDescription: 'Kitchen chimney degreasing: Normal ₹500, Medium ₹600, Large ₹1,000.',
      description: 'Chimney cleaning services: Normal 500, Medium 600, Large 1000. Chemical degreasing, baffle/mesh filter boiling bath, and oil cup disposal.',
      optionGroups: [
        {
          key: 'size',
          label: 'Chimney Size & Type',
          type: 'single',
          required: true,
          options: [
            { key: 'normal-60cm', label: 'Normal Chimney (60cm) · Rs. 500', priceDelta: 0, mrpDelta: 0, isDefault: true },
            { key: 'medium-90cm', label: 'Medium Chimney (75–90cm) · Rs. 600', priceDelta: 100, mrpDelta: 150 },
            { key: 'large-curved', label: 'Large / Island / Curved Glass · Rs. 1,000', priceDelta: 500, mrpDelta: 650 }
          ]
        }
      ],
      matrix: [
        { selection: { size: 'normal-60cm' }, price: 500, mrp: 650, duration: '45 mins' },
        { selection: { size: 'medium-90cm' }, price: 600, mrp: 800, duration: '1 hr' },
        { selection: { size: 'large-curved' }, price: 1000, mrp: 1300, duration: '1 hr 15 mins' }
      ]
    },

    // 16. Membership Bothroom maintain of one year (offer)
    {
      title: 'Membership Bathroom Maintenance (1 Year Offer)',
      slug: 'bathroom-maintenance-membership',
      aliases: ['bathroom-membership'],
      categorySlugs: ['bathroom-cleaning'],
      price: 9999,
      mrp: 15000,
      pricingType: 'normal',
      pricingMode: 'fixed',
      moradabadOnly: true,
      duration: '30 Visits / 1 Year',
      icon: 'Sparkles',
      shortDescription: 'Yearly membership: 30 visits per year for 1 bathroom. Moradabad only (Offer rate ₹9,999, original ₹15,000).',
      description: 'Membership Bathroom maintain of one year (offer): Per bathroom Rs.9999 (30 visits in one year, original rate 15000). Moradabad only. Scheduled fortnightly deep scrubbing and tap polishing.',
      inclusions: [
        '30 Scheduled bathroom deep cleaning visits across 1 full year',
        'Full descaling of tiles, WC, washbasin & shower area every visit',
        'Free replacement of toilet brush & freshener packs',
        'Priority customer hotline dispatch'
      ]
    },

    // 17. Carpet cleaning Services
    {
      title: 'Carpet Cleaning Services',
      slug: 'carpet-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'commercial-cleaning', 'home-deep-cleaning'],
      price: 30,
      mrp: 40,
      pricingType: 'unit',
      pricingUnit: 'sq_ft',
      unitRateMoradabad: 30,
      unitRateOther: 35,
      unitLabel: 'Square Feet (sq ft)',
      minUnitQuantity: 30,
      duration: '1-2 hrs',
      icon: 'Sparkles',
      shortDescription: 'Carpet deep cleaning & shampooing per square foot (₹30 / sq ft).',
      description: 'Carpet cleaning Services: Rs.30 per square feet. Injection-extraction wet shampooing, dust mite removal, fiber brightening, and stain treatment.',
      inclusions: [
        'High-suction dry vacuuming of dirt & grit',
        'Fabric-safe carpet shampoo foam injection',
        'Heavy rotary stain scrubbing and spot treatment',
        'Wet vacuum extraction leaving carpet 90% dry'
      ]
    },

    // 18. Bedhead drycleaning services
    {
      title: 'Bedhead Drycleaning Services',
      slug: 'bedhead-drycleaning-services',
      categorySlugs: ['sofa-carpet-cleaning', 'home-deep-cleaning'],
      price: 1000,
      mrp: 1400,
      pricingType: 'normal',
      pricingMode: 'tiered',
      cityExtraCharge: 500,
      duration: '1 hr',
      icon: 'Sparkles',
      shortDescription: 'Bedhead dry cleaning: Single ₹500, Double ₹1,000. Other city ₹500 extra.',
      description: 'Bedhead drycleaning services: Single bedhead Rs.500, Double bedhead Rs.1000. Other city 500 extra pay. Deep fabric dry cleaning, sweat odor removal, and anti-dust mite sanitization.',
      optionGroups: [
        {
          key: 'size',
          label: 'Bedhead Size',
          type: 'single',
          required: true,
          options: [
            { key: 'single-bedhead', label: 'Single Bedhead (Rs. 500)', priceDelta: -500, mrpDelta: -700 },
            { key: 'double-bedhead', label: 'Double Bedhead (Rs. 1,000)', priceDelta: 0, mrpDelta: 0, isDefault: true }
          ]
        }
      ],
      matrix: [
        { selection: { size: 'single-bedhead' }, price: 500, mrp: 700, duration: '45 mins' },
        { selection: { size: 'double-bedhead' }, price: 1000, mrp: 1400, duration: '1 hr' }
      ]
    },

    // 19. Chairs drycleaning services
    {
      title: 'Chairs Drycleaning Services',
      slug: 'chair-dry-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'commercial-cleaning'],
      price: 200,
      mrp: 280,
      pricingType: 'unit',
      pricingUnit: 'chair',
      unitRateMoradabad: 200,
      unitRateOther: 250,
      unitLabel: 'Chairs',
      minUnitQuantity: 2,
      duration: '45 mins',
      icon: 'Sparkles',
      shortDescription: 'Dining & office chair dry cleaning: Moradabad ₹200/chair, Other city ₹250/chair.',
      description: 'Chairs drycleaning services: Moradabad Rs.200 per chair, Other city available Rs.250 per chair. Deep foam shampooing, stain removal, and fabric extraction.',
      inclusions: [
        'Upholstery fabric & foam deep vacuuming',
        'Stain lift spray on seats and backrest',
        'Wet extraction removing dust, spills & sweat marks',
        'Wooden / chrome chair leg polishing'
      ]
    },

    // 20. Bathroom marvel cleaning
    {
      title: 'Bathroom Marble Cleaning',
      slug: 'bathroom-marble-cleaning',
      categorySlugs: ['bathroom-cleaning', 'home-deep-cleaning'],
      price: 699,
      mrp: 900,
      pricingType: 'normal',
      pricingMode: 'fixed',
      duration: '1.5 hrs',
      icon: 'Sparkles',
      shortDescription: 'Bathroom marble cleaning: Tap, CW seat, wall tiles, marble floor, exhaust.',
      description: 'Bathroom marvel cleaning: Tap, cw seat, Wall tiles, marvel floor, exhaust. Special non-acidic marble-safe cleaners to restore shine without chemical burns.',
      inclusions: [
        'Non-acidic marble floor deep scrubbing and buffing',
        'Wall tiles and stone border grout line cleaning',
        'WC seat, cover and flush plate sanitization',
        'Chrome CP taps and shower fittings shine restoration',
        'Exhaust fan and vent mesh cleaning'
      ]
    },

    // 21. Sofa Drycleaning
    {
      title: 'Sofa Drycleaning',
      slug: 'sofa-dry-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'home-deep-cleaning', 'commercial-cleaning'],
      price: 250,
      mrp: 350,
      pricingType: 'unit',
      pricingUnit: 'seat',
      unitRateMoradabad: 250,
      unitRateOther: 350,
      unitLabel: 'Sofa Seats',
      minUnitQuantity: 3,
      duration: '1.5-2 hrs',
      icon: 'Sparkles',
      shortDescription: 'Sofa dry cleaning: Moradabad ₹250 per seat, Other cities ₹350 per seat.',
      description: 'Sofa Drycleaning: Moradabad 250 per seat, Other city 350 per seat. 3-step deep dry cleaning with organic foam, high-speed rotary agitation, and industrial suction extraction.',
      inclusions: [
        'Deep dry vacuuming of crevices and cushion seams',
        'Fabric-safe shampoo injection and stain agitation',
        'High-power vacuum extraction of dirty water & mites',
        'Deodorizer and anti-allergen spray'
      ]
    },

    // 22. Commercial Office Housekeeping
    {
      title: 'Commercial Office Housekeeping',
      slug: 'commercial-office-cleaning',
      categorySlugs: ['commercial-cleaning'],
      price: 3500,
      mrp: 4500,
      pricingType: 'normal',
      pricingMode: 'tiered',
      duration: '4-8 hrs',
      icon: 'Sparkles',
      shortDescription: 'Corporate and office deep cleaning: Cabins, desks, pantry & restrooms.',
      description: 'Complete commercial housekeeping for corporate offices, clinics, retail shops, and bank branches. Sanitized workspaces, sparkling floors, and pristine washrooms.',
      inclusions: [
        'Desk surface, keyboard & monitor anti-static dust wipe',
        'Glass doors, partitions & window streak-free clean',
        'Floor scrubbing with commercial single-disc machine',
        'Pantry sink, microwave & coffee station cleaning',
        'Office washrooms chemical descaling & sanitization'
      ]
    }
  ];

  console.log(`\nProcessing ${rawServices.length} comprehensive services...`);

  for (const s of rawServices) {
    const matchedCategories = s.categorySlugs.map(slug => getCatDoc(slug)).filter(Boolean);
    const primaryCat = matchedCategories[0];

    // Preserving existing media/images if already present
    const existing = await Service.findOne({ slug: s.slug }).lean();

    const serviceData = {
      ...s,
      category: primaryCat ? primaryCat._id : undefined,
      categorySlug: primaryCat ? primaryCat.slug : s.categorySlugs[0],
      categoryName: primaryCat ? primaryCat.name : '',
      categories: matchedCategories.map(c => c._id),
      categorySlugs: matchedCategories.map(c => c.slug),
      categoryNames: matchedCategories.map(c => c.name),
      media: existing?.media || undefined,
      images: existing?.images || undefined,
      isActive: true,
      discountPct: s.mrp > s.price ? Math.round(((s.mrp - s.price) / s.mrp) * 100) : 0
    };

    const updated = await Service.findOneAndUpdate(
      { slug: s.slug },
      { $set: serviceData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✓ Synced: ${updated.title} [₹${updated.price} / MRP ₹${updated.mrp}] (${updated.pricingType})`);
  }

  // Update Category serviceCount
  for (const cat of allCategories) {
    const count = await Service.countDocuments({
      $or: [
        { category: cat._id },
        { categories: cat._id },
        { categorySlug: cat.slug },
        { categorySlugs: cat.slug }
      ],
      isActive: true
    });
    await Category.findByIdAndUpdate(cat._id, { serviceCount: count });
    console.log(`✓ Category "${cat.name}": ${count} services assigned`);
  }

  console.log('\nAll 22 services successfully synced to MongoDB Atlas!');
  await mongoose.disconnect();
}

syncServices().catch(err => {
  console.error('Failed syncing services:', err);
  process.exit(1);
});
