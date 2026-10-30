import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import City from '../src/models/City.js';
import { searchAndPrioritizeAddresses, computeAddressPriorityScore } from '../src/services/location/locationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * MongoDB Saved Cities Priority Configuration (Uttar Pradesh first)
 */
const PRIORITY_MONGO_CITIES = [
  {
    name: 'Moradabad',
    slug: 'moradabad',
    state: 'Uttar Pradesh',
    rankingScore: 1000,
    rankingTier: 'primary',
    sortOrder: 1,
    serviceRadiusKm: 30,
    coordinates: [78.7733, 28.8386],
    pincodes: ['244001', '244102', '244103', '244104', '244002'],
    tags: [
      'uttar-pradesh', 'up-priority', 'headquarters', 'brass-city',
      'molsari-masjid', 'maulsari-masjid', 'molsiry-masjid', 'jama-masjid',
      'civil-lines', 'mda-colony', 'ram-ganga-vihar', 'majhola', 'kanth-road', 'budh-bazaar'
    ]
  },
  {
    name: 'Rampur',
    slug: 'rampur',
    state: 'Uttar Pradesh',
    rankingScore: 920,
    rankingTier: 'tier_1',
    sortOrder: 2,
    serviceRadiusKm: 25,
    coordinates: [79.0250, 28.7983],
    pincodes: ['244901', '244921'],
    tags: ['uttar-pradesh', 'up-priority', 'raza-library', 'civil-lines-rampur']
  },
  {
    name: 'Amroha',
    slug: 'amroha',
    state: 'Uttar Pradesh',
    rankingScore: 900,
    rankingTier: 'tier_1',
    sortOrder: 3,
    serviceRadiusKm: 25,
    coordinates: [78.4673, 28.9044],
    pincodes: ['244221', '244222'],
    tags: ['uttar-pradesh', 'up-priority', 'joya-road', 'vasudev-tirth']
  },
  {
    name: 'Sambhal',
    slug: 'sambhal',
    state: 'Uttar Pradesh',
    rankingScore: 880,
    rankingTier: 'tier_1',
    sortOrder: 4,
    serviceRadiusKm: 25,
    coordinates: [78.5703, 28.5854],
    pincodes: ['244302', '244303'],
    tags: ['uttar-pradesh', 'up-priority', 'sambhal-town']
  },
  {
    name: 'Chandausi',
    slug: 'chandausi',
    state: 'Uttar Pradesh',
    rankingScore: 860,
    rankingTier: 'tier_1',
    sortOrder: 5,
    serviceRadiusKm: 25,
    coordinates: [78.7796, 28.4526],
    pincodes: ['244412'],
    tags: ['uttar-pradesh', 'up-priority', 'fawara-chowk']
  },
  {
    name: 'Gajraula',
    slug: 'gajraula',
    state: 'Uttar Pradesh',
    rankingScore: 850,
    rankingTier: 'tier_1',
    sortOrder: 6,
    serviceRadiusKm: 25,
    coordinates: [78.2393, 28.8456],
    pincodes: ['244235'],
    tags: ['uttar-pradesh', 'up-priority', 'nh9-hub', 'chopla']
  },
  {
    name: 'Bijnor',
    slug: 'bijnor',
    state: 'Uttar Pradesh',
    rankingScore: 830,
    rankingTier: 'tier_1',
    sortOrder: 7,
    serviceRadiusKm: 25,
    coordinates: [78.1342, 29.3724],
    pincodes: ['246701'],
    tags: ['uttar-pradesh', 'up-priority', 'bijnor-city']
  },
  {
    name: 'Dhampur',
    slug: 'dhampur',
    state: 'Uttar Pradesh',
    rankingScore: 820,
    rankingTier: 'tier_1',
    sortOrder: 8,
    serviceRadiusKm: 25,
    coordinates: [78.5085, 29.3090],
    pincodes: ['246761'],
    tags: ['uttar-pradesh', 'up-priority', 'dhampur-sugar-mill']
  },
  {
    name: 'Noorpur',
    slug: 'noorpur',
    state: 'Uttar Pradesh',
    rankingScore: 810,
    rankingTier: 'tier_1',
    sortOrder: 9,
    serviceRadiusKm: 25,
    coordinates: [78.4098, 29.1504],
    pincodes: ['246734'],
    tags: ['uttar-pradesh', 'up-priority', 'noorpur-bijnor']
  },
  {
    name: 'Hassanpur',
    slug: 'hassanpur',
    state: 'Uttar Pradesh',
    rankingScore: 800,
    rankingTier: 'tier_1',
    sortOrder: 10,
    serviceRadiusKm: 25,
    coordinates: [78.2839, 28.7244],
    pincodes: ['244241'],
    tags: ['uttar-pradesh', 'up-priority', 'hasanpur']
  },
  {
    name: 'Kashipur',
    slug: 'kashipur',
    state: 'Uttarakhand',
    rankingScore: 760,
    rankingTier: 'tier_2',
    sortOrder: 11,
    serviceRadiusKm: 25,
    coordinates: [78.9619, 29.2104],
    pincodes: ['244713'],
    tags: ['uttarakhand', 'nearby-corridor']
  }
];

async function syncAndPrioritizeMongoCities() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maxhousekeeping';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB. Updating Saved Cities Priority...');

  for (const cfg of PRIORITY_MONGO_CITIES) {
    const existing = await City.findOne({
      $or: [
        { slug: cfg.slug },
        { name: new RegExp(`^${cfg.name}$`, 'i') }
      ]
    });

    if (existing) {
      existing.state = cfg.state;
      existing.rankingScore = cfg.rankingScore;
      existing.rankingTier = cfg.rankingTier;
      existing.sortOrder = cfg.sortOrder;
      existing.serviceRadiusKm = cfg.serviceRadiusKm;
      existing.location = {
        type: 'Point',
        coordinates: cfg.coordinates
      };
      const mergedPincodes = Array.from(new Set([...(existing.pincodes || []), ...cfg.pincodes]));
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...cfg.tags]));
      existing.pincodes = mergedPincodes;
      existing.tags = mergedTags;
      await existing.save();
      console.log(`Updated priority for saved city: ${existing.name} (${existing.state}) -> Score: ${existing.rankingScore}`);
    } else {
      await City.create({
        name: cfg.name,
        slug: cfg.slug,
        state: cfg.state,
        status: 'active',
        isAvailable: true,
        rankingScore: cfg.rankingScore,
        rankingTier: cfg.rankingTier,
        sortOrder: cfg.sortOrder,
        serviceRadiusKm: cfg.serviceRadiusKm,
        location: {
          type: 'Point',
          coordinates: cfg.coordinates
        },
        pincodes: cfg.pincodes,
        tags: cfg.tags
      });
      console.log(`Inserted saved city: ${cfg.name} (${cfg.state}) -> Score: ${cfg.rankingScore}`);
    }
  }

  // Boost any other Uttar Pradesh city in MongoDB so UP cities always rank above non-UP cities
  const allCities = await City.find({});
  for (const city of allCities) {
    const isUp = /uttar pradesh/i.test(city.state || '');
    if (isUp && (!city.rankingScore || city.rankingScore < 780)) {
      city.rankingScore = 785;
      await city.save();
    }
  }

  // Test query verification for "molsiry masjid"
  const testResults = await searchAndPrioritizeAddresses({
    query: 'molsiry masjid',
    city: 'Moradabad'
  });
  console.log('\nVerification search for "molsiry masjid":');
  testResults.slice(0, 3).forEach((r, idx) => {
    console.log(`  #${idx + 1}: ${r.description} [Score: ${r.priorityScore}, City: ${r.city}, Pincode: ${r.pincode}]`);
  });

  await mongoose.disconnect();
  console.log('MongoDB Saved Cities & Uttar Pradesh Address Priority sync complete!');
}

export { PRIORITY_MONGO_CITIES, computeAddressPriorityScore, syncAndPrioritizeMongoCities };

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  syncAndPrioritizeMongoCities().catch((err) => {
    console.error('Error prioritizing cities:', err.message);
    process.exit(1);
  });
}
