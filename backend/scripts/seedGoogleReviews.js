import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/db.js';
import Testimonial from '../src/models/Testimonial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GOOGLE_REVIEWS = [
  {
    name: 'Naina Chauhan',
    role: 'Google Reviewer',
    city: 'Moradabad',
    serviceTitle: 'House Cleaning',
    quote: 'Good experience with max house cleaning services.',
    rating: 5,
    source: 'Google Review',
    reviewDateLabel: 'a week ago',
    reviewCountLabel: '1 review',
    isFeatured: true,
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Shakun Singla',
    role: 'Google Reviewer',
    city: 'Moradabad',
    serviceTitle: 'Full Home Deep Clean',
    quote:
      'The best service I could ask for! Very good staff and very efficient service. They went above and beyond to deliver the quality I was looking for! Truly amazing and highly recommend!',
    rating: 5,
    source: 'Google Review',
    reviewDateLabel: '7 months ago',
    reviewCountLabel: '10 reviews',
    isFeatured: true,
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Mohit Chaudhary',
    role: 'Google Reviewer',
    city: 'Moradabad',
    serviceTitle: 'Deep Clean · ₹1,000–2,000',
    quote: 'Good service.... Reasonable price.',
    rating: 5,
    source: 'Google Review',
    reviewDateLabel: '2 weeks ago',
    reviewCountLabel: '4 reviews',
    isFeatured: true,
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Akanksha kv',
    role: 'Local Guide',
    city: 'Moradabad',
    serviceTitle: 'Repeat Customer',
    quote:
      'Bhot acha kam kiya h, hamne dusri baar bulaya h, services achi hain bhot punctual hain or ache se kam kiya h. Service boys b pura sunte hain jase kaho or timely kam kiya.',
    rating: 5,
    source: 'Google Review',
    reviewDateLabel: '2 months ago',
    reviewCountLabel: 'Local Guide · 13 reviews',
    isFeatured: true,
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Akil Saifi',
    role: 'Google Reviewer',
    city: 'Moradabad',
    serviceTitle: 'Sofa & Stain Removal',
    quote:
      'Very satisfied with the service the team did an amazing job removed all stain and left my sofa fresh and clean great experience.',
    rating: 5,
    source: 'Google Review',
    reviewDateLabel: '3 months ago',
    reviewCountLabel: '1 review',
    isFeatured: true,
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Tripatjeetsingh Singh',
    role: 'Google Reviewer',
    city: 'Moradabad',
    serviceTitle: 'Housekeeping Service',
    quote:
      'Very nice service 👌 I like it big thanks to max housekeeping service 😊 I like your service thank u for cleaning.',
    rating: 5,
    source: 'Google Review',
    reviewDateLabel: '3 weeks ago',
    reviewCountLabel: '3 reviews',
    isFeatured: true,
    sortOrder: 6,
    isActive: true
  }
];

async function run() {
  const conn = await connectDB();
  if (!conn) {
    console.error('Failed to connect to MongoDB. Check MONGODB_URI in backend/.env');
    process.exit(1);
  }

  let inserted = 0;
  let updated = 0;

  for (const review of GOOGLE_REVIEWS) {
    const existing = await Testimonial.findOne({ name: review.name, source: 'Google Review' });
    if (existing) {
      await Testimonial.updateOne({ _id: existing._id }, { $set: review });
      updated += 1;
    } else {
      await Testimonial.create(review);
      inserted += 1;
    }
  }

  console.log(`[Seed Google Reviews] Inserted: ${inserted}, Updated: ${updated}, Total active testimonials: ${await Testimonial.countDocuments({ isActive: true })}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

