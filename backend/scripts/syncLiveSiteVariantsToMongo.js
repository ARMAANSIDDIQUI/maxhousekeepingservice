import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Service from '../src/models/Service.js';
import Category from '../src/models/Category.js';

// Exact service variants & pricing from https://www.maxhousekeepingservice.com/
const LIVE_SERVICES_DATA = [
  {
    slug: 'full-home-deep-cleaning',
    title: 'Full Home Deep Cleaning',
    categorySlug: 'home-deep-cleaning',
    variantGroupLabel: 'Apartment / House Size',
    variantGroupKey: 'size',
    variants: [
      { key: '1-bhk', label: '1 BHK', price: 2800, mrp: 2999, duration: '4-5 hrs', isDefault: true },
      { key: '2-bhk', label: '2 BHK', price: 6000, mrp: 7499, duration: '5-7 hrs', isDefault: false },
      { key: '3-bhk', label: '3 BHK', price: 9500, mrp: 10500, duration: '7-9 hrs', isDefault: false },
      { key: '4-bhk', label: '4 BHK', price: 12500, mrp: 15000, duration: '2 Days', isDefault: false },
      { key: 'villa', label: 'Villa / Kothi (5+ BHK)', price: 18000, mrp: 22000, duration: '2-3 Days', isDefault: false }
    ]
  },
  {
    slug: 'sofa-dry-cleaning',
    title: 'Sofa Dry Cleaning & Shampooing',
    categorySlug: 'sofa-carpet-cleaning',
    variantGroupLabel: 'Sofa Seats Count',
    variantGroupKey: 'size',
    variants: [
      { key: '5-seater', label: '5 Seater', price: 1750, mrp: 1999, duration: '1-2 hrs', isDefault: true },
      { key: '7-seater', label: '7 Seater', price: 2450, mrp: 2500, duration: '2-3 hrs', isDefault: false },
      { key: '9-seater', label: '9 Seater', price: 3150, mrp: 3500, duration: '3-4 hrs', isDefault: false },
      { key: '12-seater', label: '12 Seater', price: 4200, mrp: 4500, duration: '4-5 hrs', isDefault: false }
    ]
  },
  {
    slug: 'bathroom-deep-cleaning',
    title: 'Bathroom Deep Cleaning',
    categorySlug: 'bathroom-cleaning',
    variantGroupLabel: 'Bathroom Type & Tile Size',
    variantGroupKey: 'size',
    variants: [
      { key: 'medium-tile', label: 'Medium Size Tile Wala', price: 550, mrp: 700, duration: '1 hr', isDefault: true },
      { key: 'large-tile', label: 'Large Size Tile Wala', price: 750, mrp: 1000, duration: '1.5 hrs', isDefault: false },
      { key: 'medium-floor-wall', label: 'Bathroom Tiles Medium (Floor marble, wall tiles)', price: 699, mrp: 1000, duration: '1.5 hrs', isDefault: false },
      { key: 'large-marble', label: 'Marble Bathroom Cleaning Large Size', price: 1350, mrp: 1500, duration: '2 hrs', isDefault: false }
    ]
  },
  {
    slug: 'carpet-cleaning',
    title: 'Carpet Deep Cleaning',
    categorySlug: 'sofa-carpet-cleaning',
    variantGroupLabel: 'Carpet Area (Sq Ft)',
    variantGroupKey: 'size',
    variants: [
      { key: 'small-50', label: 'Small Carpet (Up to 50 Sq Ft)', price: 499, mrp: 699, duration: '1 hr', isDefault: true },
      { key: 'medium-100', label: 'Medium Carpet (50–100 Sq Ft)', price: 649, mrp: 799, duration: '1-2 hrs', isDefault: false },
      { key: 'large-150', label: 'Large Carpet (100–150 Sq Ft)', price: 799, mrp: 999, duration: '1-2 hrs', isDefault: false },
      { key: 'xlarge-200', label: 'Extra Large Carpet (150–200 Sq Ft)', price: 949, mrp: 1499, duration: '2 hrs', isDefault: false }
    ]
  },
  {
    slug: 'bed-dry-cleaning',
    title: 'Bed Mattress Dry Cleaning',
    categorySlug: 'home-deep-cleaning',
    variantGroupLabel: 'Bed Size',
    variantGroupKey: 'size',
    variants: [
      { key: 'single-bed', label: 'Single Bed', price: 600, mrp: 900, duration: '1 hr', isDefault: true },
      { key: 'double-bed', label: 'Double Bed', price: 1000, mrp: 1499, duration: '1.5 hrs', isDefault: false }
    ]
  },
  {
    slug: 'kitchen-deep-cleaning',
    title: 'Kitchen Deep Cleaning',
    categorySlug: 'kitchen-cleaning',
    variantGroupLabel: 'Kitchen Size & Commercial Type',
    variantGroupKey: 'size',
    variants: [
      { key: 'medium-kitchen', label: 'Medium Size Kitchen', price: 2500, mrp: 3000, duration: '4-5 hrs', isDefault: true },
      { key: 'big-kitchen', label: 'Big Size Kitchen', price: 6500, mrp: 8999, duration: '4-5 hrs', isDefault: false },
      { key: 'hotel-kitchen', label: 'Big Size Hotel / Commercial Kitchen', price: 10000, mrp: 14999, duration: '4-5 hrs', isDefault: false }
    ]
  },
  {
    slug: 'water-tank-cleaning',
    title: 'Water Tank Cleaning',
    categorySlug: 'commercial-cleaning',
    variantGroupLabel: 'Tank Water Capacity',
    variantGroupKey: 'size',
    variants: [
      { key: '500l', label: '500L Tank', price: 400, mrp: 499, duration: '1 hr', isDefault: true },
      { key: '750l', label: '750L Tank', price: 500, mrp: 699, duration: '1 hr', isDefault: false },
      { key: '1000l', label: '1,000L Tank', price: 700, mrp: 1000, duration: '1 hr', isDefault: false },
      { key: '1500l', label: '1,500L Tank', price: 1000, mrp: 1200, duration: '1 hr', isDefault: false },
      { key: '2000l', label: '2,000L Tank', price: 1500, mrp: 1700, duration: '1 hr', isDefault: false },
      { key: '3000l', label: '3,000L Tank', price: 2000, mrp: 2200, duration: '1 hr', isDefault: false },
      { key: '5000l', label: '5,000L Tank', price: 2500, mrp: 3000, duration: '1-2 hrs', isDefault: false }
    ]
  },
  {
    slug: 'chair-dry-cleaning',
    title: 'Office & Dining Chair Dry Cleaning',
    categorySlug: 'home-deep-cleaning',
    variantGroupLabel: 'Number of Chairs',
    variantGroupKey: 'size',
    variants: [
      { key: '4-chairs', label: 'Upto 4 Chairs', price: 700, mrp: 900, duration: '1 hr', isDefault: true },
      { key: '6-chairs', label: 'Upto 6 Chairs', price: 1200, mrp: 1500, duration: '1 hr', isDefault: false },
      { key: '9-chairs', label: 'Upto 9 Chairs', price: 1500, mrp: 1800, duration: '1.5 hrs', isDefault: false },
      { key: '12-chairs', label: 'Upto 12 Chairs', price: 2000, mrp: 2500, duration: '2 hrs', isDefault: false }
    ]
  },
  {
    slug: 'commercial-office-cleaning',
    title: 'Commercial Office Housekeeping',
    categorySlug: 'commercial-cleaning',
    variantGroupLabel: 'Office Carpet Area',
    variantGroupKey: 'size',
    variants: [
      { key: 'small-office', label: 'Small Office (Up to 1,000 Sq Ft)', price: 3500, mrp: 4500, duration: '3-4 hrs', isDefault: true },
      { key: 'medium-office', label: 'Medium Office (1,000–3,000 Sq Ft)', price: 6500, mrp: 8500, duration: '5-6 hrs', isDefault: false },
      { key: 'large-floor', label: 'Full Floor Commercial (3,000+ Sq Ft)', price: 12000, mrp: 16000, duration: '1-2 Days', isDefault: false }
    ]
  }
];

async function syncLiveVariants() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.');

  for (const item of LIVE_SERVICES_DATA) {
    const defaultVar = item.variants.find(v => v.isDefault) || item.variants[0];
    const discountPct = defaultVar.mrp > defaultVar.price ? Math.round(((defaultVar.mrp - defaultVar.price) / defaultVar.mrp) * 100) : 0;

    const matrix = item.variants.map(v => ({
      selection: { [item.variantGroupKey]: v.key },
      price: v.price,
      mrp: v.mrp,
      duration: v.duration,
      isActive: true
    }));

    const optionGroups = [
      {
        key: item.variantGroupKey,
        label: item.variantGroupLabel,
        type: 'single',
        required: true,
        sortOrder: 0,
        options: item.variants.map(v => ({
          key: v.key,
          label: v.label,
          isDefault: v.isDefault,
          priceDelta: v.price - defaultVar.price,
          mrpDelta: v.mrp - defaultVar.mrp,
          durationDelta: v.duration,
          isActive: true
        }))
      }
    ];

    const updated = await Service.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          title: item.title,
          price: defaultVar.price,
          mrp: defaultVar.mrp,
          discountPct,
          duration: defaultVar.duration,
          pricingMode: 'tiered',
          matrix,
          optionGroups
        }
      },
      { new: true }
    );

    if (updated) {
      console.log(`✓ Updated ${updated.title} with ${item.variants.length} variants (Base: ₹${defaultVar.price} / MRP ₹${defaultVar.mrp})`);
    } else {
      console.log(`- Service with slug "${item.slug}" not found in DB.`);
    }
  }

  await mongoose.disconnect();
  console.log('Finished updating MongoDB service variants.');
}

syncLiveVariants().catch(console.error);
