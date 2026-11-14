import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Service from '../src/models/Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const conn = await connectDB();
  if (!conn) {
    console.error('Failed to connect to MongoDB.');
    process.exit(1);
  }

  let category = await Category.findOne({
    $or: [
      { slug: 'commercial-cleaning' },
      { slug: 'corporates-commercial' },
      { name: /commercial|corporate|office/i }
    ]
  });

  if (!category) {
    category = await Category.findOne({ isActive: true });
  }

  const imageUrl = '/media/services/hotel-cleaning.jpg';

  const serviceData = {
    title: 'Hotel Cleaning',
    slug: 'hotel-cleaning',
    aliases: ['hotel-deep-cleaning', 'hotel-room-cleaning'],
    category: category?._id,
    categorySlug: category?.slug || 'commercial-cleaning',
    categoryName: category?.name || 'Commercial Cleaning',
    categories: category ? [category._id] : [],
    categorySlugs: category ? [category.slug] : ['commercial-cleaning'],
    categoryNames: category ? [category.name] : ['Commercial Cleaning'],
    shortDescription: 'Complete guest room, lobby, carpet vacuuming, and hospitality sanitization at ₹15/sq.ft. (MRP ₹18/sq.ft.).',
    description:
      'Specialized hospitality and hotel deep cleaning by uniformed Max Housekeeping technicians. Covers guest room sanitization, furniture & bedside wiping, carpet vacuuming, glass & mirror polishing, and washroom descaling using hospital-grade eco-safe solutions.',
    duration: '2-4 hrs',
    icon: 'Building2',
    realisticIcon: 'hotel',
    pricingType: 'unit',
    pricingUnit: 'sq_ft',
    unitLabel: 'Sq. Ft.',
    minUnitQuantity: 100,
    unitRateMoradabad: 15,
    unitRateOther: 15,
    pricingMode: 'fixed',
    price: 15,
    mrp: 18,
    discountPct: 17,
    matrix: [],
    inclusions: [
      'Guest room furniture, headboard & bedside table sanitization',
      'High-suction carpet & rug vacuuming',
      'Window glass, mirror & balcony channel wiping',
      'Bathroom & washroom fixture descaling and disinfection',
      'Uniformed crew with eco-safe hospitality-grade chemicals'
    ],
    exclusions: [
      'Laundry & dry-cleaning of hotel linen/curtains (available as add-on)',
      'Exterior high-rise glass facade cleaning requiring scaffolding'
    ],
    media: {
      hero: {
        url: imageUrl,
        alt: 'Hotel Cleaning Service by Max Housekeeping Uniformed Crew'
      },
      gallery: [
        {
          url: imageUrl,
          alt: 'Max Housekeeping Hotel Room Sanitization & Vacuuming'
        }
      ]
    },
    images: [
      {
        url: imageUrl,
        alt: 'Hotel Cleaning Service by Max Housekeeping Uniformed Crew'
      }
    ],
    tags: ['hotel', 'hospitality', 'commercial', 'resort', 'guest room', 'sq ft', 'carpet'],
    rankingScore: 250,
    rankingTier: 'top_rated',
    isPopular: true,
    isActive: true
  };

  const existing = await Service.findOne({ slug: 'hotel-cleaning' });
  if (existing) {
    await Service.updateOne({ _id: existing._id }, { $set: serviceData });
    console.log('[Seed Hotel Cleaning] Updated existing Hotel Cleaning service.');
  } else {
    await Service.create(serviceData);
    console.log('[Seed Hotel Cleaning] Created new Hotel Cleaning service.');
  }

  const saved = await Service.findOne({ slug: 'hotel-cleaning' })
    .select('title slug categoryName pricingType pricingUnit price mrp unitRateMoradabad unitRateOther minUnitQuantity')
    .lean();
  console.log('Saved service:', JSON.stringify(saved));
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
