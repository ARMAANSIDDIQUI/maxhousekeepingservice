import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary from '../src/config/cloudinary.js';

import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import City from '../src/models/City.js';
import Service from '../src/models/Service.js';
import Brand from '../src/models/Brand.js';
import Testimonial from '../src/models/Testimonial.js';
import Coupon from '../src/models/Coupon.js';
import Settings from '../src/models/Settings.js';
import { Media } from '../src/models/Supporting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_PUBLIC = path.resolve(__dirname, '../../frontend/public');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maxhousekeeping';

// Cloudinary upload helper with check for already uploaded URLs
async function uploadToCloudinary(localRelPath, folder, customPublicId = null) {
  try {
    const cleanPath = localRelPath.replace(/^\//, '');
    const absolutePath = path.resolve(FRONTEND_PUBLIC, cleanPath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[Cloudinary Warning] Local file not found: ${absolutePath}`);
      return null;
    }

    const options = {
      folder,
      resource_type: 'image',
      overwrite: false // Do not re-upload if already exists on Cloudinary with publicId
    };

    if (customPublicId) {
      options.public_id = customPublicId;
    }

    console.log(`[Cloudinary] Uploading ${path.basename(absolutePath)} to ${folder}...`);
    const result = await cloudinary.uploader.upload(absolutePath, options);

    // Track or update in Media collection
    try {
      await Media.findOneAndUpdate(
        { publicId: result.public_id },
        {
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: 'image',
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          alt: path.basename(absolutePath, path.extname(absolutePath)),
          folder
        },
        { upsert: true, new: true }
      );
    } catch (mediaErr) {
      console.warn('[Media Collection Notice]:', mediaErr.message);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (err) {
    console.error(`[Cloudinary Upload Error] Failed for ${localRelPath}:`, err.message);
    return null;
  }
}

async function uploadAndSeed() {
  try {
    console.log('====================================================');
    console.log('MAX HOUSEKEEPING - DATA UPLOAD & CLOUDINARY SYNC');
    console.log('====================================================');
    console.log('Connecting to MongoDB at:', MONGODB_URI.split('@')[1] || MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully.');

    // 0. Cloudinary Ping Test
    const pingRes = await cloudinary.api.ping();
    console.log('✓ Cloudinary connection verified:', pingRes.status);

    // ----------------------------------------------------
    // 1. Upload & Upsert 6 Categories
    // ----------------------------------------------------
    console.log('\n--- 1. Processing Categories ---');
    const categoriesData = [
      {
        name: 'Home Cleaning',
        slug: 'home-deep-cleaning',
        description: 'Complete room-by-room deep scrubbing, floor machine buffing, and high-touch surface sanitisation.',
        iconKey: 'PiHouseLine',
        localImage: 'media/categories/home-deep-cleaning.jpg',
        sortOrder: 1
      },
      {
        name: 'Bathroom Cleaning',
        slug: 'bathroom-cleaning',
        description: 'Hard water tile descaling, acid-free fixture polishing, and anti-bacterial grouting scrub.',
        iconKey: 'PiBathtub',
        localImage: 'media/categories/bathroom-cleaning.jpg',
        sortOrder: 2
      },
      {
        name: 'Kitchen Cleaning',
        slug: 'kitchen-cleaning',
        description: 'Heavy grease extraction, chimney degreasing, slab scrubbing, and appliance exterior detailing.',
        iconKey: 'PiCookingPot',
        localImage: 'media/categories/kitchen-cleaning.jpg',
        sortOrder: 3
      },
      {
        name: 'Sofa & Carpet Cleaning',
        slug: 'sofa-carpet-cleaning',
        description: 'Industrial wet-extraction shampooing, fabric stain treatment, and fast-drying upholstery care.',
        iconKey: 'PiArmchair',
        localImage: 'media/categories/sofa-carpet-cleaning.jpg',
        sortOrder: 4
      },
      {
        name: 'Commercial Cleaning',
        slug: 'commercial-cleaning',
        description: 'Corporate offices, retail outlets, banks, salons, and institutional facility housekeeping.',
        iconKey: 'PiBuildingOffice',
        localImage: 'media/categories/commercial-cleaning.jpg',
        sortOrder: 5
      },
      {
        name: 'Pest Control',
        slug: 'pest-control',
        description: 'Odorless herbal gel pest treatments and long-lasting pest management protection.',
        iconKey: 'PiBug',
        localImage: 'media/categories/pest-control.jpg',
        sortOrder: 6
      }
    ];

    const categoryDocsMap = {};

    for (const cat of categoriesData) {
      let existing = await Category.findOne({ slug: cat.slug });
      let imageUrl = existing?.image?.url;
      let imagePublicId = existing?.image?.publicId;

      // Check if image already exists on Cloudinary
      if (!imageUrl || !imageUrl.startsWith('https://res.cloudinary.com')) {
        const uploadRes = await uploadToCloudinary(
          cat.localImage,
          'max-housekeeping/categories',
          `cat_${cat.slug}`
        );
        if (uploadRes) {
          imageUrl = uploadRes.url;
          imagePublicId = uploadRes.publicId;
        }
      } else {
        console.log(`[Category] ${cat.name} already has Cloudinary image: ${imageUrl}`);
      }

      const updateData = {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        iconKey: cat.iconKey,
        sortOrder: cat.sortOrder,
        isActive: true,
        image: {
          url: imageUrl || `/media/categories/${cat.slug}.jpg`,
          publicId: imagePublicId || `cat_${cat.slug}`,
          alt: `${cat.name} service`
        }
      };

      const savedCat = await Category.findOneAndUpdate(
        { slug: cat.slug },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryDocsMap[cat.slug] = savedCat;
      console.log(`✓ Category processed: ${cat.name} (${cat.slug}) -> ${savedCat.image?.url?.substring(0, 50)}...`);
    }

    // ----------------------------------------------------
    // 2. Upload & Upsert 10 Active Cities in Western UP
    // ----------------------------------------------------
    console.log('\n--- 2. Processing 10 Active Cities ---');
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
      },
      {
        name: 'Kanth',
        slug: 'kanth',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [78.6300, 29.0600] },
        pincodes: ['244501'],
        serviceRadiusKm: 20,
        sortOrder: 10,
        status: 'active'
      }
    ];

    for (const city of citiesData) {
      await City.findOneAndUpdate(
        { slug: city.slug },
        city,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ City processed: ${city.name} (${city.slug})`);
    }

    // ----------------------------------------------------
    // 3. Upload & Upsert 9 Consolidated Services with Dual-Pricing
    // ----------------------------------------------------
    console.log('\n--- 3. Processing Services ---');
    const servicesData = [
      {
        title: 'Full Home Deep Cleaning',
        slug: 'full-home-deep-cleaning',
        categorySlug: 'home-deep-cleaning',
        categoryName: 'Home Cleaning',
        shortDescription: 'Complete residential deep cleaning with floor scrubbing machines, bathroom tile descaling, and dusting.',
        description: 'Our signature whole-house treatment covers every corner of your home. Professional crew equipped with industrial single-disc floor scrubbers, wet extraction vacuums, and eco-friendly Taski chemicals.',
        duration: '4-5 hrs',
        price: 3499,
        mrp: 3999,
        isPopular: true,
        sortOrder: 1,
        localImage: 'media/services/full-home-deep-cleaning.jpg',
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
        categorySlug: 'bathroom-cleaning',
        categoryName: 'Bathroom Cleaning',
        shortDescription: 'Tile hard-water descaling, acid-free tap polishing, and WC sanitisation.',
        description: 'Remove yellow scaling, mildew, and limescale from tiles and glass partitions with professional chemical application and rotary scrubbing.',
        duration: '1-2 hrs',
        price: 799,
        mrp: 999,
        isPopular: true,
        sortOrder: 2,
        localImage: 'media/services/bathroom-tile-cleaning.jpg',
        inclusions: [
          'Wall tiles descaling and grouting scrub',
          'WC pot, washbasin, and vanity sanitisation',
          'Taps, showerheads, and chrome fittings polishing',
          'Mirror and glass partition streak-free wipe',
          'Floor scrub and drain trap clearing'
        ],
        optionGroups: [
          {
            key: 'count',
            label: 'Number of Bathrooms',
            type: 'single',
            options: [
              { key: '1-bath', label: '1 Bathroom', isDefault: true },
              { key: '2-bath', label: '2 Bathrooms' },
              { key: '3-bath', label: '3 Bathrooms' },
              { key: '4-bath', label: '4 Bathrooms' }
            ]
          }
        ],
        matrix: [
          { selection: { count: '1-bath' }, price: 799, mrp: 999, duration: '1-1.5 hrs' },
          { selection: { count: '2-bath' }, price: 1499, mrp: 1899, duration: '2-2.5 hrs' },
          { selection: { count: '3-bath' }, price: 2199, mrp: 2799, duration: '3-3.5 hrs' },
          { selection: { count: '4-bath' }, price: 2799, mrp: 3599, duration: '4 hrs' }
        ]
      },
      {
        title: 'Kitchen Deep Cleaning',
        slug: 'kitchen-deep-cleaning',
        categorySlug: 'kitchen-cleaning',
        categoryName: 'Kitchen Cleaning',
        shortDescription: 'Industrial degreasing of chimney exterior, gas stove, sink, and tiles.',
        description: 'Attack sticky oil residues and cooking grease with high-temp steam application and food-safe degreasers.',
        duration: '2-3 hrs',
        price: 1499,
        mrp: 1899,
        isPopular: true,
        sortOrder: 3,
        localImage: 'media/services/kitchen-deep-cleaning.jpg',
        inclusions: [
          'Gas stove, burners, and countertop degreasing',
          'Wall tiles steam wash and oil extraction',
          'Kitchen sink descaling and pipe clearing',
          'Cabinet exterior detailing and handles wipe',
          'Chimney filter wash (exterior mesh)'
        ],
        optionGroups: [
          {
            key: 'type',
            label: 'Kitchen Configuration',
            type: 'single',
            options: [
              { key: 'standard', label: 'Standard Kitchen', isDefault: true },
              { key: 'modular', label: 'Modular Kitchen (Cabinets Inside + Outside)' }
            ]
          }
        ],
        matrix: [
          { selection: { type: 'standard' }, price: 1499, mrp: 1899, duration: '2 hrs' },
          { selection: { type: 'modular' }, price: 2299, mrp: 2899, duration: '3-3.5 hrs' }
        ]
      },
      {
        title: 'Sofa Dry Cleaning & Shampooing',
        slug: 'sofa-dry-cleaning',
        categorySlug: 'sofa-carpet-cleaning',
        categoryName: 'Sofa & Carpet Cleaning',
        shortDescription: 'Shampoo foam wash and industrial wet-vacuum moisture extraction.',
        description: 'Revive your fabric or suede upholstery. Removes tea/coffee stains, dust mites, and odors, leaving the sofa 90% dry on spot.',
        duration: '1-2 hrs',
        price: 999,
        mrp: 1299,
        isPopular: true,
        sortOrder: 4,
        localImage: 'media/services/sofa-dry-cleaning.jpg',
        inclusions: [
          'High-power dry vacuuming of dust and crumbs',
          'Fabric shampoo agitation with soft horsehair brushes',
          'Stain-spotting chemical treatment',
          'Wet extraction vacuum to suck out dirty slurry',
          'Fragrance mist application'
        ],
        optionGroups: [
          {
            key: 'seats',
            label: 'Sofa Seater Count',
            type: 'single',
            options: [
              { key: '3-seater', label: '3-Seater Sofa', isDefault: true },
              { key: '5-seater', label: '5-Seater Sofa (3+1+1 or L-Shape)' },
              { key: '7-seater', label: '7-Seater Sofa / Large Sectional' }
            ]
          }
        ],
        matrix: [
          { selection: { seats: '3-seater' }, price: 999, mrp: 1299, duration: '1 hr' },
          { selection: { seats: '5-seater' }, price: 1499, mrp: 1899, duration: '1.5-2 hrs' },
          { selection: { seats: '7-seater' }, price: 1999, mrp: 2499, duration: '2-2.5 hrs' }
        ]
      },
      {
        title: 'Carpet Deep Cleaning',
        slug: 'carpet-cleaning',
        categorySlug: 'sofa-carpet-cleaning',
        categoryName: 'Sofa & Carpet Cleaning',
        shortDescription: 'Deep wet shampoo extraction for living room and dining room carpets.',
        description: 'Restore high-traffic carpet fibers, extract deep sand and pet hair, and eliminate bacteria with commercial scrubbers.',
        duration: '1-2 hrs',
        price: 799,
        mrp: 999,
        sortOrder: 5,
        localImage: 'media/categories/sofa-carpet-cleaning.jpg',
        inclusions: [
          'Beater-bar dry vacuuming',
          'Low-moisture foam shampoo application',
          'High-suction water extraction'
        ],
        optionGroups: [
          {
            key: 'size',
            label: 'Carpet Size',
            type: 'single',
            options: [
              { key: 'small', label: 'Small (Up to 25 sq ft)', isDefault: true },
              { key: 'medium', label: 'Medium (Up to 50 sq ft)' },
              { key: 'large', label: 'Large (Up to 100 sq ft)' }
            ]
          }
        ],
        matrix: [
          { selection: { size: 'small' }, price: 799, mrp: 999, duration: '45 mins' },
          { selection: { size: 'medium' }, price: 1199, mrp: 1499, duration: '1 hr' },
          { selection: { size: 'large' }, price: 1799, mrp: 2299, duration: '1.5 hrs' }
        ]
      },
      {
        title: 'Bed Mattress Dry Cleaning',
        slug: 'bed-dry-cleaning',
        categorySlug: 'home-deep-cleaning',
        categoryName: 'Home Cleaning',
        shortDescription: 'Antibacterial UV sanitisation and hot-foam shampooing for mattresses.',
        description: 'Neutralise bed allergens, dead skin flakes, and sweat stains with dual-sided deep extraction.',
        duration: '1 hr',
        price: 999,
        mrp: 1299,
        sortOrder: 6,
        localImage: 'media/categories/home-deep-cleaning.jpg',
        inclusions: [
          'HEPA-filter deep dry vacuuming',
          'Spot stain cleaning',
          'Antibacterial anti-mite treatment'
        ],
        optionGroups: [
          {
            key: 'size',
            label: 'Mattress Size',
            type: 'single',
            options: [
              { key: 'single', label: 'Single Bed Mattress', isDefault: true },
              { key: 'queen', label: 'Queen Bed Mattress' },
              { key: 'king', label: 'King Bed Mattress' }
            ]
          }
        ],
        matrix: [
          { selection: { size: 'single' }, price: 999, mrp: 1299, duration: '45 mins' },
          { selection: { size: 'queen' }, price: 1499, mrp: 1899, duration: '1 hr' },
          { selection: { size: 'king' }, price: 1799, mrp: 2199, duration: '1.25 hrs' }
        ]
      },
      {
        title: 'Water Tank Cleaning',
        slug: 'water-tank-cleaning',
        categorySlug: 'home-deep-cleaning',
        categoryName: 'Home Cleaning',
        shortDescription: '6-stage mechanised sludge dewatering, high pressure jetting, and UV sanitisation.',
        description: 'Ensure 100% pure drinking water. Our crew sterilises overhead and underground tanks without harsh chemicals.',
        duration: '1-2 hrs',
        price: 799,
        mrp: 999,
        sortOrder: 7,
        localImage: 'media/site/hero-clean-home.jpg',
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
              { key: '10000l', label: 'Up to 10,000 Litres' }
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
        categorySlug: 'sofa-carpet-cleaning',
        categoryName: 'Sofa & Carpet Cleaning',
        shortDescription: 'Shampooing and stain removal for cushioned dining and office revolving chairs.',
        description: 'Remove sweat, ink, and coffee marks from conference and dining chairs with rapid foam extraction.',
        duration: '1 hr',
        price: 799,
        mrp: 999,
        sortOrder: 8,
        localImage: 'media/categories/sofa-carpet-cleaning.jpg',
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
        categorySlug: 'commercial-cleaning',
        categoryName: 'Commercial Cleaning',
        shortDescription: 'Comprehensive deep cleaning for banks, retail showrooms, gyms, clinics, and workspaces.',
        description: 'Trusted by leading institutions across Moradabad and Western UP including Bank of Baroda, Geetanjali Salon, Tanishq, and Subway.',
        duration: '4-6 hrs',
        price: 4999,
        mrp: 6499,
        isPopular: true,
        sortOrder: 9,
        localImage: 'media/categories/commercial-cleaning.jpg',
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

    for (const svc of servicesData) {
      const catDoc = categoryDocsMap[svc.categorySlug];
      let existingSvc = await Service.findOne({ slug: svc.slug });
      let heroUrl = existingSvc?.media?.hero?.url;
      let heroPublicId = existingSvc?.media?.hero?.publicId;

      if (!heroUrl || !heroUrl.startsWith('https://res.cloudinary.com')) {
        const uploadRes = await uploadToCloudinary(
          svc.localImage,
          'max-housekeeping/services',
          `svc_${svc.slug}`
        );
        if (uploadRes) {
          heroUrl = uploadRes.url;
          heroPublicId = uploadRes.publicId;
        }
      } else {
        console.log(`[Service] ${svc.title} already has Cloudinary image: ${heroUrl}`);
      }

      const updateData = {
        title: svc.title,
        slug: svc.slug,
        category: catDoc?._id || existingSvc?.category,
        categorySlug: svc.categorySlug,
        categoryName: svc.categoryName,
        shortDescription: svc.shortDescription,
        description: svc.description,
        duration: svc.duration,
        price: svc.price,
        mrp: svc.mrp,
        isPopular: svc.isPopular || false,
        sortOrder: svc.sortOrder,
        isActive: true,
        inclusions: svc.inclusions,
        exclusions: svc.exclusions || [],
        optionGroups: svc.optionGroups,
        matrix: svc.matrix,
        media: {
          hero: {
            url: heroUrl || `/media/services/${svc.slug}.jpg`,
            publicId: heroPublicId || `svc_${svc.slug}`,
            alt: `${svc.title} worker in uniform`
          }
        }
      };

      const savedSvc = await Service.findOneAndUpdate(
        { slug: svc.slug },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Service processed: ${svc.title} (${svc.slug}) -> ${savedSvc.media?.hero?.url?.substring(0, 50)}...`);
    }

    // ----------------------------------------------------
    // 4. Upload & Upsert 15 Corporate Brand Partners
    // ----------------------------------------------------
    console.log('\n--- 4. Processing Partner Brands ---');
    const brandsData = [
      { name: 'Bank Of Baroda', localLogo: 'brands/bank-of-baroda.jpg', sortOrder: 1 },
      { name: 'Geetanjali Salon', localLogo: 'brands/geetanjali-salon.jpg', sortOrder: 2 },
      { name: 'Kundans', localLogo: 'brands/kundans.jpg', sortOrder: 3 },
      { name: 'Redtape', localLogo: 'brands/redtape.jpg', sortOrder: 4 },
      { name: 'Punjab National Bank', localLogo: 'brands/punjab-national-bank.jpg', sortOrder: 5 },
      { name: 'Subway', localLogo: 'brands/subway.jpg', sortOrder: 6 },
      { name: 'Temptations', localLogo: 'brands/temptations.jpg', sortOrder: 7 },
      { name: 'V-Mart', localLogo: 'brands/v-mart.jpg', sortOrder: 8 },
      { name: 'Tanishq', localLogo: 'brands/tanishq.jpg', sortOrder: 9 },
      { name: 'Metro', localLogo: 'brands/metro.jpg', sortOrder: 10 },
      { name: 'Bikanervala', localLogo: 'brands/bikanervala.jpg', sortOrder: 11 },
      { name: 'Gajraula Haveli', localLogo: 'brands/gajraula.jpg', sortOrder: 12 },
      { name: 'Gold\'s Gym', localLogo: 'brands/goldgym.jpg', sortOrder: 13 },
      { name: 'Mooga', localLogo: 'brands/mooga.jpg', sortOrder: 14 },
      { name: 'NGM Group', localLogo: 'brands/ngm.jpg', sortOrder: 15 }
    ];

    for (const b of brandsData) {
      let existingBrand = await Brand.findOne({ name: b.name });
      let logoUrl = existingBrand?.logoUrl;

      if (!logoUrl || !logoUrl.startsWith('https://res.cloudinary.com')) {
        const brandSlug = b.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const uploadRes = await uploadToCloudinary(
          b.localLogo,
          'max-housekeeping/brands',
          `brand_${brandSlug}`
        );
        if (uploadRes) {
          logoUrl = uploadRes.url;
        }
      }

      await Brand.findOneAndUpdate(
        { name: b.name },
        {
          name: b.name,
          logoUrl: logoUrl || `/${b.localLogo}`,
          sortOrder: b.sortOrder,
          isActive: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Brand processed: ${b.name}`);
    }

    // ----------------------------------------------------
    // 5. Testimonials
    // ----------------------------------------------------
    console.log('\n--- 5. Processing Testimonials ---');
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

    for (const t of testimonialsData) {
      await Testimonial.findOneAndUpdate(
        { name: t.name, city: t.city },
        t,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Testimonial processed: ${t.name}`);
    }

    // ----------------------------------------------------
    // 6. Settings
    // ----------------------------------------------------
    console.log('\n--- 6. Processing Settings ---');
    await Settings.findOneAndUpdate(
      {},
      {
        businessName: 'Max House Keeping Service',
        tagline: 'Housekeeping & Commercial Cleaning Experts',
        primaryPhone: '9897766002',
        secondaryPhone: '8210523309',
        supportEmail: 'contact@maxhousekeepingservice.com',
        headquarters: {
          address: 'Moradabad, Uttar Pradesh, India',
          city: 'Moradabad',
          state: 'Uttar Pradesh'
        },
        workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
        socialLinks: {
          whatsapp: '9897766002'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('✓ Business settings verified.');

    // ----------------------------------------------------
    // 7. Coupons
    // ----------------------------------------------------
    console.log('\n--- 7. Processing Coupons ---');
    const couponsData = [
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
    ];

    for (const c of couponsData) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        c,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Coupon processed: ${c.code}`);
    }

    // ----------------------------------------------------
    // 8. Admin User & Sample Customer
    // ----------------------------------------------------
    console.log('\n--- 8. Processing Users ---');
    let admin = await User.findOne({ email: 'admin@maxhousekeepingservice.com' });
    if (!admin) {
      admin = new User({
        name: 'Max Housekeeping Admin',
        phone: '9897766002',
        email: 'admin@maxhousekeepingservice.com',
        passwordHash: 'AdminPassword2026!',
        role: 'admin',
        authProvider: 'local',
        emailVerified: true,
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=10231D&textColor=E9A23B&radius=50'
      });
      await admin.save();
      console.log('✓ Created admin user: admin@maxhousekeepingservice.com');
    } else {
      admin.role = 'admin';
      admin.emailVerified = true;
      await admin.save();
      console.log('✓ Verified admin user exists and has role admin: admin@maxhousekeepingservice.com');
    }

    let customer = await User.findOne({ email: 'customer@example.com' });
    if (!customer) {
      customer = new User({
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
          }
        ]
      });
      await customer.save();
      console.log('✓ Created demo customer: customer@example.com');
    } else {
      console.log('✓ Demo customer already exists.');
    }

    console.log('\n====================================================');
    console.log('✓ ALL DATA AND CLOUDINARY IMAGES UPLOADED & VERIFIED!');
    console.log('====================================================');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error during upload & seed:', err);
    process.exit(1);
  }
}

uploadAndSeed();
