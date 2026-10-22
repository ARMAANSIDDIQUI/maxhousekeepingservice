import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const serviceSchema = new mongoose.Schema({}, { strict: false });
const citySchema = new mongoose.Schema({}, { strict: false });

const Service = mongoose.model('Service', serviceSchema);
const City = mongoose.model('City', citySchema);

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // 1. SEED CITY TAGS & RANKING SCORES
  // Moradabad is headquarters (highest ranking score 1000).
  // Nearby tier 1 outstation cities have ranking score 800-900.
  const cityUpdates = [
    {
      slug: 'moradabad',
      rankingScore: 1000,
      rankingTier: 'primary',
      tags: ['headquarters', 'moradabad', 'kanth-road', 'full-home-cleaning', 'water-tank', 'sofa-cleaning', 'carpet-cleaning', 'same-day-service', 'zero-dispatch-fee']
    },
    {
      slug: 'rampur',
      rankingScore: 880,
      rankingTier: 'tier_1',
      tags: ['rampur', 'civil-lines-rampur', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch', 'fast-service']
    },
    {
      slug: 'sambhal',
      rankingScore: 860,
      rankingTier: 'tier_1',
      tags: ['sambhal', 'chandausi-road', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'amroha',
      rankingScore: 850,
      rankingTier: 'tier_1',
      tags: ['amroha', 'joya', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'chandausi',
      rankingScore: 840,
      rankingTier: 'tier_1',
      tags: ['chandausi', 'station-road', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'kashipur',
      rankingScore: 820,
      rankingTier: 'tier_2',
      tags: ['kashipur', 'uttarakhand-border', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'bijnor',
      rankingScore: 810,
      rankingTier: 'tier_2',
      tags: ['bijnor', 'ganga-barrage', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'dhampur',
      rankingScore: 800,
      rankingTier: 'tier_2',
      tags: ['dhampur', 'nethaur', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'gajraula',
      rankingScore: 790,
      rankingTier: 'tier_2',
      tags: ['gajraula', 'nh24-corridor', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    },
    {
      slug: 'hassanpur',
      rankingScore: 780,
      rankingTier: 'tier_2',
      tags: ['hassanpur', 'amroha-district', 'sofa-dry-cleaning', 'carpet-cleaning', 'chair-cleaning', 'doorstep-dispatch']
    }
  ];

  for (const c of cityUpdates) {
    const res = await City.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          rankingScore: c.rankingScore,
          rankingTier: c.rankingTier,
          tags: c.tags
        }
      },
      { new: true }
    );
    if (res) {
      console.log(`Updated City [${c.slug}]: Rank=${c.rankingScore}, Tags=${c.tags.length}`);
    }
  }

  // Also ensure any other cities have a default ranking
  await City.updateMany(
    { rankingScore: { $exists: false } },
    { $set: { rankingScore: 500, rankingTier: 'tier_2', tags: ['western-up', 'doorstep-cleaning'] } }
  );

  // 2. SEED SERVICE TAGS & RANKING SCORES
  // Bestsellers & Multi-city heroes (Sofa, Carpet, Chair) get highest rank for scaling!
  const services = await Service.find();
  console.log(`Found ${services.length} total services to check/tag.`);

  for (const s of services) {
    let rankingScore = 100;
    let rankingTier = 'standard';
    const tagsSet = new Set(s.tags || []);

    const titleLower = (s.title || '').toLowerCase();
    const slugLower = (s.slug || '').toLowerCase();

    // Outstation Scaling Flagships (Available in all cities)
    if (slugLower.includes('sofa') || titleLower.includes('sofa')) {
      rankingScore = 950;
      rankingTier = 'bestseller';
      ['sofa-dry-cleaning', 'fabric-sofa', 'leather-sofa', 'shampooing', 'stain-removal', 'all-cities-available', 'fast-drying', 'bestseller'].forEach(t => tagsSet.add(t));
    } else if (slugLower.includes('carpet') || titleLower.includes('carpet')) {
      rankingScore = 920;
      rankingTier = 'bestseller';
      ['carpet-cleaning', 'rug-shampooing', 'dust-mite-removal', 'per-sq-ft', 'all-cities-available', 'bestseller'].forEach(t => tagsSet.add(t));
    } else if (slugLower.includes('chair') || titleLower.includes('chair')) {
      rankingScore = 900;
      rankingTier = 'top_rated';
      ['chair-dry-cleaning', 'dining-chairs', 'office-chairs', 'per-chair', 'all-cities-available', 'top-rated'].forEach(t => tagsSet.add(t));
    } else if (slugLower.includes('tank') || titleLower.includes('tank')) {
      rankingScore = 850;
      rankingTier = 'top_rated';
      ['water-tank-cleaning', 'underground-tank', 'overhead-tank', 'uv-sanitization', 'sludge-removal', 'moradabad'].forEach(t => tagsSet.add(t));
    } else if (slugLower.includes('kitchen') || titleLower.includes('kitchen')) {
      rankingScore = 800;
      rankingTier = 'trending';
      ['kitchen-deep-cleaning', 'chimney-degreasing', 'cabinet-cleaning', 'tiles-descaling', 'moradabad'].forEach(t => tagsSet.add(t));
    } else if (slugLower.includes('bathroom') || titleLower.includes('bathroom') || titleLower.includes('tile')) {
      rankingScore = 780;
      rankingTier = 'trending';
      ['bathroom-deep-cleaning', 'tile-grout-cleaning', 'hard-water-stain-removal', 'sanitization', 'moradabad'].forEach(t => tagsSet.add(t));
    } else if (slugLower.includes('home') || titleLower.includes('home')) {
      rankingScore = 820;
      rankingTier = 'top_rated';
      ['full-home-deep-cleaning', '1bhk', '2bhk', '3bhk', 'villa-cleaning', 'move-in-cleaning', 'moradabad'].forEach(t => tagsSet.add(t));
    } else {
      rankingScore = 500;
      rankingTier = 'standard';
      ['deep-cleaning', 'housekeeping', 'professional-cleaning', 'moradabad'].forEach(t => tagsSet.add(t));
    }

    await Service.updateOne(
      { _id: s._id },
      {
        $set: {
          rankingScore,
          rankingTier,
          tags: Array.from(tagsSet)
        }
      }
    );
    console.log(`Updated Service [${s.title}]: Rank=${rankingScore}, Tier=${rankingTier}, Tags=${tagsSet.size}`);
  }

  console.log('Seeding of tags and ranking complete!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
