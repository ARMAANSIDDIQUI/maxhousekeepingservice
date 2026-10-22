import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Category from '../src/models/Category.js';
import Service from '../src/models/Service.js';

// Images repository mapped from current Cloudinary & local assets
const MEDIA_MAP = {
  'full-home-deep-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911413/max-housekeeping/services/svc_full-home-deep-cleaning.jpg',
  'kitchen-deep-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911422/max-housekeeping/services/svc_kitchen-deep-cleaning.jpg',
  'chimney-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911422/max-housekeeping/services/svc_kitchen-deep-cleaning.jpg',
  'fridge-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911422/max-housekeeping/services/svc_kitchen-deep-cleaning.jpg',
  'bathroom-deep-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911418/max-housekeeping/services/svc_bathroom-deep-cleaning.jpg',
  'bathroom-maintenance-membership': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911418/max-housekeeping/services/svc_bathroom-deep-cleaning.jpg',
  'water-tank-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911436/max-housekeeping/services/svc_water-tank-cleaning.jpg',
  'sofa-dry-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911409/max-housekeeping/services/svc_sofa-dry-cleaning.jpg',
  'carpet-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911427/max-housekeeping/services/svc_carpet-cleaning.jpg',
  'bed-dry-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911431/max-housekeeping/services/svc_bed-dry-cleaning.jpg',
  'chair-dry-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911444/max-housekeeping/services/svc_chair-dry-cleaning.jpg',
  'commercial-office-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911440/max-housekeeping/services/svc_commercial-office-cleaning.jpg',
  'floor-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911413/max-housekeeping/services/svc_full-home-deep-cleaning.jpg',
  'fans-cleaning-services': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911413/max-housekeeping/services/svc_full-home-deep-cleaning.jpg',
  'swimming-pool-cleaning': 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911436/max-housekeeping/services/svc_water-tank-cleaning.jpg'
};

async function syncAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Syncing categories and rewritten services...');

  // Ensure all baseline categories exist
  const categoriesDef = [
    { name: 'Home Cleaning', slug: 'home-deep-cleaning', iconKey: 'PiHouseLine', sortOrder: 1, tagline: 'Whole-house scrub, single-disc floor buffing & hospital-grade disinfection.' },
    { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', iconKey: 'PiBathtub', sortOrder: 2, tagline: 'Acid-free tile descaling, hard water stain removal & chrome tap polish.' },
    { name: 'Kitchen Cleaning', slug: 'kitchen-cleaning', iconKey: 'PiCookingPot', sortOrder: 3, tagline: 'Heavy grease extraction, chimney degrease & countertop hygiene scrub.' },
    { name: 'Sofa & Carpet Cleaning', slug: 'sofa-carpet-cleaning', iconKey: 'PiArmchair', sortOrder: 4, tagline: 'Industrial wet injection-extraction shampooing & fast moisture suction.' },
    { name: 'Commercial Cleaning', slug: 'commercial-cleaning', iconKey: 'PiBuildingOffice', sortOrder: 5, tagline: 'Offices, showrooms, banks, gyms & corporate facility housekeeping.' },
    { name: 'Pest Control', slug: 'pest-control', iconKey: 'PiBug', sortOrder: 6, tagline: 'Complimentary cockroach, termite & ant gel application.' }
  ];

  const catMap = {};
  for (const c of categoriesDef) {
    let catDoc = await Category.findOne({ slug: c.slug });
    if (!catDoc) {
      catDoc = await Category.create(c);
      console.log(`Created Category: ${catDoc.name} (${catDoc.slug})`);
    } else {
      catDoc.name = c.name;
      catDoc.tagline = c.tagline;
      catDoc.iconKey = c.iconKey;
      catDoc.sortOrder = c.sortOrder;
      await catDoc.save();
    }
    catMap[c.slug] = catDoc;
  }

  // 15 Services Definition based on User Request and Mongo combinations
  const rawServices = [
    {
      title: 'Full Home Deep Cleaning',
      slug: 'full-home-deep-cleaning',
      categorySlugs: ['home-deep-cleaning'],
      icon: 'House',
      duration: '4-6 hrs',
      variantGroupLabel: 'Apartment / House Size',
      variantGroupKey: 'size',
      variants: [
        { key: '1-bhk', label: '1 BHK Home Deep Cleaning', price: 4999, mrp: 5999, duration: '3-4 hrs', isDefault: true },
        { key: '2-bhk', label: '2 BHK Home Deep Cleaning', price: 7500, mrp: 8999, duration: '5-6 hrs' },
        { key: '3-bhk', label: '3 BHK Home Deep Cleaning', price: 9999, mrp: 11999, duration: '6-7 hrs' },
        { key: '4-bhk', label: '4 BHK Home Deep Cleaning', price: 14999, mrp: 17999, duration: '1-2 Days' },
        { key: '5-bhk', label: '5 BHK / Villa Deep Cleaning', price: 16999, mrp: 20999, duration: '2 Days' }
      ],
      shortDescription: 'Full home cleaning services include both bathroom and kitchen cleaning. Moradabad square feet rate Rs.15.',
      description: 'Complete residential deep cleaning services including both bathroom and kitchen deep cleaning. Moradabad area only (without sofa drycleaning). Square feet rate: Moradabad Rs. 15 / sq ft; Other cities Rs. 25 / sq ft deep cleaning (call for custom quotes). Professional crew equipped with industrial single-disc floor scrubbers, wet extraction vacuums, and eco-friendly Taski chemicals.',
      inclusions: [
        'Full home cleaning services include both bathroom and kitchen cleaning',
        'Moradabad only without sofa drycleaning: Rs. 15 per square feet',
        'Other city rate Rs. 25 square feet deep cleaning (call for custom orders)',
        'Single disc machine floor scrubbing with Diversey chemicals',
        'All cupboards deep cleaned exterior and interior',
        'Balcony, window panes, grills & doors sanitisation',
        'Ceiling fans, switchboards & light fixtures dusting'
      ],
      exclusions: [
        'Sofa dry cleaning (available as separate service or package add-on)'
      ],
      sortOrder: 1,
      isPopular: true
    },
    {
      title: 'Kitchen Deep Cleaning',
      slug: 'kitchen-deep-cleaning',
      categorySlugs: ['kitchen-cleaning', 'home-deep-cleaning'],
      icon: 'CookingPot',
      duration: '2-4 hrs',
      variantGroupLabel: 'Kitchen Size & Package',
      variantGroupKey: 'size',
      variants: [
        { key: 'small-kitchen', label: 'Small Kitchen Cleaning (Flat / Ghar)', price: 1000, mrp: 1500, duration: '1.5-2 hrs', isDefault: true },
        { key: 'medium-kitchen', label: 'Medium Kitchen Cleaning (Complimentary Cockroach Treatment)', price: 2500, mrp: 3000, duration: '2-3 hrs' },
        { key: 'big-kitchen', label: 'Big Kitchen Deep Cleaning (Full Cupboards & Chimney)', price: 5000, mrp: 6500, duration: '3-4 hrs' },
        { key: 'hotel-kitchen', label: 'Commercial / Hotel Kitchen Deep Cleaning', price: 10000, mrp: 14999, duration: '4-6 hrs' }
      ],
      shortDescription: 'From basic flat kitchen to big kitchen with cupboards, chimney, steel drawer, and complimentary cockroach pest control.',
      description: 'Small kitchen cleaning flat ghar services: Rs. 1,000 (MRP Rs. 1,500) - basic flat cleaning without chimney or cupboard. Medium kitchen cleaning: Rs. 2,500 with complimentary cockroach treatment. Big kitchen deep cleaning: Rs. 5,000 (MRP Rs. 6,500) covering all cupboards deep clean with chimney, steel drawer, sink, tiles, marble slab, fans, refrigerator with cockroach & rat pest control.',
      inclusions: [
        'Tiles, countertops and marble slab oil and grease extraction',
        'Sink, taps, and stainless steel fittings descaling & buffing',
        'Complimentary cockroach treatment in medium and big packages',
        'All cupboards deep clean with chimney and steel drawer (Big Kitchen)',
        'Refrigerator and fan cleaning included in Big Kitchen package'
      ],
      exclusions: [
        'Chimney and cupboard interior cleaning not included in Small Kitchen tier'
      ],
      sortOrder: 2,
      isPopular: true
    },
    {
      title: 'Chimney Cleaning Services',
      slug: 'chimney-cleaning',
      categorySlugs: ['kitchen-cleaning'],
      icon: 'Flame',
      duration: '1-1.5 hrs',
      variantGroupLabel: 'Chimney Size & Type',
      variantGroupKey: 'size',
      variants: [
        { key: 'normal-chimney', label: 'Normal Chimney (60cm)', price: 500, mrp: 650, duration: '1 hr', isDefault: true },
        { key: 'medium-chimney', label: 'Medium Chimney (75cm - 90cm)', price: 600, mrp: 800, duration: '1-1.5 hrs' },
        { key: 'large-chimney', label: 'Large / Curved Glass Chimney', price: 1000, mrp: 1300, duration: '1.5-2 hrs' }
      ],
      shortDescription: 'Normal 500, Medium 600, Large 1000. Removes heavy grease, oil build-up and carbon deposits.',
      description: 'Chimney cleaning services: Normal Rs. 500, Medium Rs. 600, Large Rs. 1,000. Specialized heavy-duty degreaser removes burnt carbon, oil clogs in mesh filters, baffle filters, and blower motor chamber.',
      inclusions: [
        'Baffle and mesh filter chemical degreasing wash',
        'Oil collection tray emptying and hot chemical cleaning',
        'Motor housing and blower fan dusting',
        'Exterior stainless steel and curved glass mirror polish'
      ],
      exclusions: [],
      sortOrder: 3
    },
    {
      title: 'Fridge Cleaning Services',
      slug: 'fridge-cleaning',
      categorySlugs: ['kitchen-cleaning'],
      icon: 'Snowflake',
      duration: '1 hr',
      variantGroupLabel: 'Refrigerator Type',
      variantGroupKey: 'size',
      variants: [
        { key: 'single-door', label: 'Single Door Refrigerator', price: 500, mrp: 650, duration: '1 hr', isDefault: true },
        { key: 'double-door', label: 'Double Door Frost-Free Refrigerator', price: 750, mrp: 950, duration: '1-1.5 hrs' },
        { key: 'side-by-side', label: 'Side-by-Side / Multi-Door Refrigerator', price: 1100, mrp: 1400, duration: '1.5-2 hrs' }
      ],
      shortDescription: 'Effective Rs. 500.00 (MRP Rs. 650.00). Complete antibacterial sanitisation and odor eradication.',
      description: 'Fridge cleaning services: Offered at Rs. 500.00 (MRP Rs. 650.00). All internal trays, vegetable crisper baskets, and door shelves are dismantled, scrubbed, sanitised with food-grade disinfectants, and deodorised.',
      inclusions: [
        'Removal and thorough wash of all internal racks and crisper trays',
        'Door rubber gasket anti-mold disinfection',
        'Food-safe antibacterial wipe and deodorisation',
        'Exterior cabinet and handle shine'
      ],
      exclusions: [],
      sortOrder: 4
    },
    {
      title: 'Bathroom Deep Cleaning',
      slug: 'bathroom-deep-cleaning',
      categorySlugs: ['bathroom-cleaning', 'home-deep-cleaning'],
      icon: 'Bath',
      duration: '1-1.5 hrs',
      variantGroupLabel: 'Bathroom Type & Tile Size',
      variantGroupKey: 'size',
      variants: [
        { key: 'small-tile', label: 'Small Size Tile Wala Bathroom', price: 499, mrp: 650, duration: '1 hr', isDefault: true },
        { key: 'medium-tile', label: 'Medium Size Tile Wala Bathroom', price: 550, mrp: 700, duration: '1 hr' },
        { key: 'large-tile', label: 'Large Size Tiles Wala Bathroom', price: 700, mrp: 1000, duration: '1.5 hrs' },
        { key: 'marble-bathroom', label: 'Bathroom Marble Cleaning', price: 699, mrp: 1000, duration: '1.5 hrs' },
        { key: 'premium-large-marble', label: 'Large Marble Bathroom Polishing & Scrub', price: 1350, mrp: 1500, duration: '2 hrs' }
      ],
      shortDescription: 'Tile wala bathroom cleaning (Small Rs.499, Medium Rs.550, Large Rs.700) and Marble cleaning Rs.699.',
      description: 'Tile wala bathroom cleaning: Small Rs. 499, Medium size Rs. 550 (MRP Rs. 700), Large size tiles Rs. 700 (MRP Rs. 1,000). Bathroom marble cleaning Rs. 699 includes taps, CW seat, wall tiles, marble floor, and exhaust fan cleaning using acid-free Taski R1 & R2 formulas.',
      inclusions: [
        'Acid-free wall tile descaling and yellow stain eradication',
        'Chrome taps, health faucets, and overhead showers mirror buffing',
        'Commode / WC seat and ceramic washbasin sanitisation',
        'Bathroom marble floor or tile mechanical scrubbing',
        'Exhaust fan, mirror, and medicine cabinet wipe'
      ],
      exclusions: [],
      sortOrder: 5,
      isPopular: true
    },
    {
      title: 'Annual Bathroom Maintenance Membership',
      slug: 'bathroom-maintenance-membership',
      categorySlugs: ['bathroom-cleaning'],
      icon: 'ShieldCheck',
      duration: '1 Year (30 Visits)',
      variantGroupLabel: 'Membership Coverage',
      variantGroupKey: 'coverage',
      variants: [
        { key: '1-bathroom-30-visits', label: '1 Bathroom (30 Visits / 1 Year)', price: 9999, mrp: 15000, duration: '1 Year (30 visits)', isDefault: true },
        { key: '2-bathroom-60-visits', label: '2 Bathrooms (60 Visits / 1 Year)', price: 18999, mrp: 28000, duration: '1 Year (60 visits)' }
      ],
      shortDescription: 'Membership Bathroom Maintenance of one year (offer). Rs. 9,999 for 30 visits (original rate 15,000). Moradabad only.',
      description: 'Exclusive annual bathroom maintenance offer for Moradabad homes. Enjoy 30 professional deep cleaning visits throughout the year (approx every 12 days). Per bathroom Rs. 9,999 (original rate Rs. 15,000). Keeps your bathroom spotless, scale-free, and hygienic year-round.',
      inclusions: [
        '30 scheduled deep cleaning visits in 1 year (Moradabad only)',
        'Full acid-free tile descaling and chrome polishing each visit',
        'WC seat, washbasin and drain sanitisation',
        'Priority dispatch and zero cancellation fees'
      ],
      exclusions: [
        'Valid in Moradabad municipal area only'
      ],
      sortOrder: 6
    },
    {
      title: 'Water Tank Cleaning Services',
      slug: 'water-tank-cleaning',
      categorySlugs: ['home-deep-cleaning', 'commercial-cleaning'],
      icon: 'Waves',
      duration: '1-2 hrs',
      variantGroupLabel: 'Tank Water Capacity',
      variantGroupKey: 'size',
      variants: [
        { key: '500l', label: '500 Litre Tank', price: 400, mrp: 499, duration: '1 hr', isDefault: true },
        { key: '750l', label: '750 Litre Tank', price: 500, mrp: 699, duration: '1 hr' },
        { key: '1000l', label: '1,000 Litre Tank', price: 700, mrp: 1000, duration: '1 hr' },
        { key: '1500l', label: '1,500 Litre Tank', price: 1000, mrp: 1200, duration: '1 hr' },
        { key: '2000l', label: '2,000 Litre Tank', price: 1500, mrp: 1700, duration: '1 hr' },
        { key: '3000l', label: '3,000 Litre Tank', price: 2000, mrp: 2400, duration: '1.5 hrs' },
        { key: '5000l', label: '5,000 Litre Tank', price: 2500, mrp: 3000, duration: '2 hrs' }
      ],
      shortDescription: '500L Rs.400, 750L Rs.500, 1000L Rs.700, 1500L Rs.1000, 2000L Rs.1500, 3000L Rs.2000. Watch video: https://youtu.be/yCkBXdzwjic',
      description: 'Water tank cleaning services with 6-stage hygienic process: de-sludging, high-pressure rotary jet washing, anti-bacterial sludge vacuuming, chlorine wash, and UV lamp sanitisation. Pricing: 500L Rs. 400, 750L Rs. 500, 1000L Rs. 700, 1500L Rs. 1000, 2000L Rs. 1500, 3000L Rs. 2000. Watch our live process video: https://youtu.be/yCkBXdzwjic',
      inclusions: [
        'Drainage of residual contaminated water and silt',
        'High-pressure rotary jet machine wall and ceiling scrub',
        'Submersible vacuum sludge removal',
        'Food-grade antibacterial chemical treatment',
        'Process demonstration video: https://youtu.be/yCkBXdzwjic'
      ],
      exclusions: [],
      sortOrder: 7
    },
    {
      title: 'Sofa Dry Cleaning & Shampooing',
      slug: 'sofa-dry-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'home-deep-cleaning'],
      icon: 'Armchair',
      duration: '1-3 hrs',
      variantGroupLabel: 'Sofa Seats Count',
      variantGroupKey: 'size',
      variants: [
        { key: '3-seater', label: '3 Seater Sofa (Moradabad Rs. 250/seat)', price: 750, mrp: 900, duration: '1-1.5 hrs', isDefault: true },
        { key: '5-seater', label: '5 Seater Sofa (Moradabad Rs. 250/seat)', price: 1250, mrp: 1500, duration: '1.5-2 hrs' },
        { key: '7-seater', label: '7 Seater Sofa (Moradabad Rs. 250/seat)', price: 1750, mrp: 2100, duration: '2-3 hrs' },
        { key: '9-seater', label: '9 Seater L-Shape Sofa', price: 2250, mrp: 2700, duration: '3-4 hrs' },
        { key: '12-seater', label: '12 Seater Sectional Sofa', price: 3000, mrp: 3600, duration: '4-5 hrs' }
      ],
      shortDescription: 'Sofa Drycleaning Moradabad Rs. 250 per seat. Other city rate Rs. 350 per seat.',
      description: 'Sofa dry cleaning services: Moradabad Rs. 250 per seat; other city rate Rs. 350 per seat. Industrial injection-extraction shampooing lifts deeply embedded stains, dust mites, sweat marks, and odors while revitalising upholstery fabrics.',
      inclusions: [
        'High-power dry vacuuming to remove loose lint and dirt',
        'Specialised spot treatment on food and grease stains',
        'Rotary foam shampoo scrub with fabric-safe conditioners',
        'Moisture extraction for rapid 2-3 hour drying'
      ],
      exclusions: [],
      sortOrder: 8,
      isPopular: true
    },
    {
      title: 'Carpet Deep Cleaning Services',
      slug: 'carpet-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'commercial-cleaning'],
      icon: 'Layers',
      duration: '1-2 hrs',
      variantGroupLabel: 'Carpet Area',
      variantGroupKey: 'size',
      variants: [
        { key: 'small-30', label: 'Small Carpet (Up to 30 Sq Ft)', price: 499, mrp: 650, duration: '1 hr', isDefault: true },
        { key: 'medium-100', label: 'Medium Carpet (50–100 Sq Ft)', price: 649, mrp: 799, duration: '1-1.5 hrs' },
        { key: 'large-150', label: 'Large Carpet (100–150 Sq Ft)', price: 799, mrp: 999, duration: '1.5-2 hrs' },
        { key: 'xlarge-200', label: 'Extra Large Carpet (150–200 Sq Ft)', price: 949, mrp: 1499, duration: '2 hrs' },
        { key: 'per-sqft', label: 'Custom Area (Rs. 30 per square foot)', price: 1500, mrp: 2000, duration: '2 hrs' }
      ],
      shortDescription: 'Carpet cleaning services at Rs. 30 per square feet.',
      description: 'Carpet cleaning services: Rs. 30 per square feet. High-temperature hot water extraction and specialized foam shampooing removes dirt, dust mites, spill stains, and odors from woollen, Persian, and synthetic rugs.',
      inclusions: [
        'Dual-motor HEPA vacuuming for deep particulate extraction',
        'Pre-spray enzyme stain treatment for stubborn spots',
        'Taski carpet shampoo injection and mechanical agitation',
        'Moisture recovery extraction for rapid drying'
      ],
      exclusions: [],
      sortOrder: 9
    },
    {
      title: 'Bed Mattress & Bedhead Dry Cleaning',
      slug: 'bed-dry-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'home-deep-cleaning'],
      icon: 'Bed',
      duration: '1-2 hrs',
      variantGroupLabel: 'Mattress & Bedhead Type',
      variantGroupKey: 'size',
      variants: [
        { key: 'single-bedhead', label: 'Single Bedhead Drycleaning', price: 500, mrp: 700, duration: '1 hr', isDefault: true },
        { key: 'double-bedhead', label: 'Double Bedhead Drycleaning', price: 1000, mrp: 1400, duration: '1 hr' },
        { key: 'single-bed-mattress', label: 'Single Bed Mattress (One Side)', price: 600, mrp: 900, duration: '1 hr' },
        { key: 'double-bed-mattress-up', label: 'Double Bed Mattress (Up / Top Side Only)', price: 1000, mrp: 1400, duration: '1.5 hrs' },
        { key: 'double-bed-mattress-both', label: 'Double Bed Mattress (Both Sides Front & Back)', price: 2000, mrp: 2800, duration: '2 hrs' },
        { key: 'bedhead-bed-combo', label: 'Medium Double Bedhead with Bed (Front Only)', price: 1500, mrp: 2000, duration: '2 hrs' }
      ],
      shortDescription: 'Double bed mattress up drycleaning Rs.1,000 (backside 1000 extra). Bedhead: Single Rs.500, Double Rs.1,000. Bedhead+Bed combo Rs.1,500.',
      description: 'Double bed mattress up drycleaning Rs. 1,000 (backside Rs. 1,000 extra pay only). Bedhead drycleaning services: Single bedhead Rs. 500, Double bedhead Rs. 1,000 (other city 500 extra pay). Medium Double bedhead with bed drycleaning service: Rs. 1,500 (MRP Rs. 2,000; front only, backside Rs. 1,000 extra pay, other city 500 extra pay). UV antibacterial anti-mite sanitisation included.',
      inclusions: [
        'High-filtration dry extraction for dust mites and dead skin cells',
        'Targeted foam shampooing for sweat and makeup stains',
        'Antibacterial sanitisation and fabric deodorising',
        'Moisture extraction for clean, hygienic sleep'
      ],
      exclusions: [
        'Backside cleaning requires add-on selection or extra fee'
      ],
      sortOrder: 10
    },
    {
      title: 'Chairs Dry Cleaning Services',
      slug: 'chair-dry-cleaning',
      categorySlugs: ['sofa-carpet-cleaning', 'commercial-cleaning'],
      icon: 'Armchair',
      duration: '1-2 hrs',
      variantGroupLabel: 'Number of Chairs',
      variantGroupKey: 'size',
      variants: [
        { key: '2-chairs', label: '2 Chairs (Moradabad Rs. 200/chair)', price: 400, mrp: 500, duration: '1 hr', isDefault: true },
        { key: '4-chairs', label: '4 Chairs (Moradabad Rs. 200/chair)', price: 800, mrp: 1000, duration: '1 hr' },
        { key: '6-chairs', label: '6 Dining Chairs (Moradabad Rs. 200/chair)', price: 1200, mrp: 1500, duration: '1.5 hrs' },
        { key: '8-chairs', label: '8 Chairs (Dining / Office)', price: 1600, mrp: 2000, duration: '1.5 hrs' },
        { key: '12-chairs', label: '12 Chairs (Office / Conference)', price: 2400, mrp: 3000, duration: '2 hrs' }
      ],
      shortDescription: 'Chairs drycleaning services: Moradabad Rs. 200 per chair. Other city available Rs. 250 per chair.',
      description: 'Chairs drycleaning services: Moradabad Rs. 200 per chair; other cities available at Rs. 250 per chair. Professional foam extraction for dining chairs, executive office chairs, conference seating, and fabric armchairs.',
      inclusions: [
        'Dry vacuuming of fabric backrest and seat cushions',
        'Foam shampoo scrub to lift food stains and dust',
        'Moisture suction and fabric refresher spray'
      ],
      exclusions: [],
      sortOrder: 11
    },
    {
      title: 'Floor Machine Cleaning & Scrubbing',
      slug: 'floor-cleaning',
      categorySlugs: ['home-deep-cleaning', 'commercial-cleaning'],
      icon: 'Sparkles',
      duration: '2-4 hrs',
      variantGroupLabel: 'Floor Area Coverage',
      variantGroupKey: 'size',
      variants: [
        { key: 'upto-200', label: 'Up to 200 Sq Ft (Mini Area / Shop)', price: 1500, mrp: 2000, duration: '1.5 hrs', isDefault: true },
        { key: 'upto-500', label: 'Up to 500 Sq Ft (Small Flat / Ground Floor)', price: 2500, mrp: 3500, duration: '2-3 hrs' },
        { key: 'upto-1000', label: 'Up to 1,000 Sq Ft (Medium House / Showroom)', price: 4500, mrp: 6000, duration: '3-4 hrs' },
        { key: 'upto-2000', label: 'Up to 2,000 Sq Ft (Large Bungalow / Office)', price: 8000, mrp: 10500, duration: '4-6 hrs' },
        { key: 'per-sqft', label: 'Floor Cleaning (Rs. 10 per square feet)', price: 10, mrp: 15, duration: 'Custom' }
      ],
      shortDescription: 'Floor cleaning Rs. 10 per square feet. Single disc machine Red pad cleaning services, Diversey chemical used.',
      description: 'Floor cleaning: Rs. 10 per square feet. Heavy-duty single disc machine with Red scouring pad deep scrubbing. Professional Diversey chemicals (Taski) used for grease, grout cleaning, floor dullness, and tile brightening.',
      inclusions: [
        'Single disc industrial machine scrub with Red Pad',
        'Diversey Taski chemical treatment for hard floor stains',
        'Wet vacuum suction of dislodged slurry and grime',
        'Microfiber mop neutralisation and drying'
      ],
      exclusions: [],
      sortOrder: 12
    },
    {
      title: 'Fans Cleaning Services',
      slug: 'fans-cleaning-services',
      categorySlugs: ['home-deep-cleaning', 'kitchen-cleaning'],
      icon: 'Fan',
      duration: '1 hr',
      variantGroupLabel: 'Fan Quantity',
      variantGroupKey: 'quantity',
      variants: [
        { key: '1-fan', label: '1 Fan (Ceiling or Exhaust)', price: 80, mrp: 100, duration: '30 mins', isDefault: true },
        { key: '3-fans', label: '3 Fans Package', price: 240, mrp: 300, duration: '1 hr' },
        { key: '5-fans', label: '5 Fans Package', price: 380, mrp: 500, duration: '1.5 hrs' },
        { key: '8-fans', label: '8 Fans (Full House Package)', price: 599, mrp: 800, duration: '2 hrs' }
      ],
      shortDescription: 'Fans cleaning services: Rs. 80.00 (MRP Rs. 100.00) per fan.',
      description: 'Fans cleaning services: Rs. 80.00 (MRP Rs. 100.00). Complete degreasing and dust removal from ceiling fans, exhaust fans, and wall-mounted fans with drop-cloth protection.',
      inclusions: [
        'Removal of thick dust cakes and sticky grease',
        'Exhaust fan baffle and blade degrease',
        'Motor casing wipe and shine',
        'Floor cover protection during cleaning'
      ],
      exclusions: [],
      sortOrder: 13
    },
    {
      title: 'Swimming Pool Cleaning',
      slug: 'swimming-pool-cleaning',
      categorySlugs: ['commercial-cleaning', 'home-deep-cleaning'],
      icon: 'Waves',
      duration: '3-6 hrs',
      variantGroupLabel: 'Pool Water Capacity',
      variantGroupKey: 'size',
      variants: [
        { key: 'small-pool', label: 'Small Pool (Up to 25,000 Litres)', price: 2500, mrp: 3500, duration: '3 hrs', isDefault: true },
        { key: 'medium-pool', label: 'Medium Pool (25,000 - 50,000 Litres)', price: 4500, mrp: 6000, duration: '4-5 hrs' },
        { key: 'large-pool', label: 'Large Pool (50,000 - 100,000 Litres)', price: 7500, mrp: 10000, duration: '6 hrs' },
        { key: 'resort-pool', label: 'Commercial / Resort Pool (100,000+ Litres)', price: 12000, mrp: 16000, duration: '1 Day' }
      ],
      shortDescription: 'Swimming pool cleaning: Rs. 0.05 per litre Moradabad only, other city 0.10 per litre.',
      description: 'Professional swimming pool cleaning and water clarity management. Pricing: Rs. 0.05 per litre Moradabad only, other city Rs. 0.10 per litre. Algae brushing, submersible vacuuming, sand filter backwash, and chlorine shock balancing.',
      inclusions: [
        'Surface leaf and debris netting',
        'Mechanical wall and tile line scrub to eliminate algae spores',
        'Underwater sediment and silt vacuuming',
        'Filter backwash and rinse cycle',
        'Chemical testing and chlorine balance dosing'
      ],
      exclusions: [],
      sortOrder: 14
    },
    {
      title: 'Commercial Office Housekeeping',
      slug: 'commercial-office-cleaning',
      categorySlugs: ['commercial-cleaning'],
      icon: 'Building',
      duration: '3-4 hrs',
      variantGroupLabel: 'Office Carpet Area',
      variantGroupKey: 'size',
      variants: [
        { key: 'small-office', label: 'Small Office (Up to 1,000 Sq Ft)', price: 3500, mrp: 4500, duration: '3-4 hrs', isDefault: true },
        { key: 'medium-office', label: 'Medium Office (1,000–3,000 Sq Ft)', price: 6500, mrp: 8500, duration: '5-6 hrs' },
        { key: 'large-floor', label: 'Full Floor Commercial (3,000+ Sq Ft)', price: 12000, mrp: 16000, duration: '1-2 Days' }
      ],
      shortDescription: 'End-to-end commercial housekeeping for offices, banks, clinics, and corporate spaces.',
      description: 'Professional commercial office housekeeping covering workstations, reception lobbies, conference rooms, pantry sanitisation, glass partition wipe, and industrial floor machine scrubbing.',
      inclusions: [
        'Workstation, computer desk and chair dusting & sanitisation',
        'Full pantry, coffee station and microwave deep cleaning',
        'Restroom disinfection and chrome fittings polish',
        'Glass partitions, doors and windows streak-free wipe',
        'Floor single disc machine scrub and buff'
      ],
      exclusions: [],
      sortOrder: 15
    }
  ];

  console.log(`Processing ${rawServices.length} comprehensive services...`);

  for (const s of rawServices) {
    const primaryCat = catMap[s.categorySlugs[0]] || Object.values(catMap)[0];
    const categoryDocs = s.categorySlugs.map(slug => catMap[slug]).filter(Boolean);

    const defaultVar = s.variants.find(v => v.isDefault) || s.variants[0];
    const basePrice = defaultVar.price;
    const baseMrp = defaultVar.mrp;
    const discountPct = baseMrp > basePrice ? Math.round(((baseMrp - basePrice) / baseMrp) * 100) : 0;

    const matrix = s.variants.map(v => ({
      selection: { [s.variantGroupKey]: v.key },
      price: v.price,
      mrp: v.mrp,
      duration: v.duration,
      isActive: true
    }));

    const optionGroups = [
      {
        key: s.variantGroupKey,
        label: s.variantGroupLabel,
        type: 'single',
        required: true,
        sortOrder: 0,
        options: s.variants.map(v => ({
          key: v.key,
          label: v.label,
          priceDelta: v.price - basePrice,
          mrpDelta: v.mrp - baseMrp,
          durationDelta: v.duration,
          isDefault: Boolean(v.isDefault),
          isActive: true
        }))
      }
    ];

    const serviceData = {
      title: s.title,
      slug: s.slug,
      category: primaryCat._id,
      categorySlug: primaryCat.slug,
      categoryName: primaryCat.name,
      categories: categoryDocs.map(c => c._id),
      categorySlugs: categoryDocs.map(c => c.slug),
      categoryNames: categoryDocs.map(c => c.name),
      shortDescription: s.shortDescription,
      description: s.description,
      duration: s.duration,
      icon: s.icon,
      pricingMode: 'tiered',
      price: basePrice,
      mrp: baseMrp,
      discountPct,
      matrix,
      optionGroups,
      inclusions: s.inclusions,
      exclusions: s.exclusions,
      media: {
        hero: {
          url: MEDIA_MAP[s.slug] || 'https://res.cloudinary.com/ewuoxjdy/image/upload/v1791911413/max-housekeeping/services/svc_full-home-deep-cleaning.jpg',
          alt: `${s.title} deep cleaning`
        }
      },
      sortOrder: s.sortOrder,
      isPopular: Boolean(s.isPopular),
      isActive: true
    };

    const updated = await Service.findOneAndUpdate(
      { slug: s.slug },
      serviceData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Synced Service: "${updated.title}" (${updated.slug}) | Base Price: ₹${updated.price} (MRP: ₹${updated.mrp}) | Categories: ${updated.categoryNames?.join(', ')}`);
  }

  // Update category service counts in DB
  for (const cat of Object.values(catMap)) {
    const count = await Service.countDocuments({
      $or: [{ category: cat._id }, { categories: cat._id }],
      isActive: true
    });
    cat.serviceCount = count;
    await cat.save();
    console.log(`Category "${cat.name}": ${count} active services`);
  }

  console.log('Finished syncing all categories and services to MongoDB successfully.');
  await mongoose.disconnect();
}

syncAll().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
