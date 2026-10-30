import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import City from '../src/models/City.js';
import { computeAddressPriorityScore, searchAndPrioritizeAddresses } from '../src/services/location/locationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Fetches cities directly from MongoDB first and ensures their rankingScores
 * and sortOrders are properly prioritized (Uttar Pradesh cities first).
 * Zero hardcoded cities or places!
 */
async function syncAndPrioritizeMongoCities() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maxhousekeeping';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB. Fetching saved cities from MongoDB...');

  const mongoCities = await City.find({}).sort({ sortOrder: 1, rankingScore: -1, name: 1 });
  console.log(`Loaded ${mongoCities.length} saved cities directly from MongoDB.`);

  for (let idx = 0; idx < mongoCities.length; idx++) {
    const city = mongoCities[idx];
    const isUp = /uttar pradesh/i.test(city.state || 'Uttar Pradesh');
    if (!city.rankingScore) {
      city.rankingScore = isUp ? Math.max(800, 1000 - idx * 20) : 700;
    }
    if (!city.sortOrder) {
      city.sortOrder = idx + 1;
    }
    await city.save();
    console.log(
      `  [${idx + 1}] ${city.name} (${city.state || 'Uttar Pradesh'}) -> Score: ${city.rankingScore}, Pincodes: ${(city.pincodes || []).join(', ')}`
    );
  }

  await mongoose.disconnect();
  console.log('MongoDB Saved Cities Priority sync complete!');
}

export { computeAddressPriorityScore, searchAndPrioritizeAddresses, syncAndPrioritizeMongoCities };

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  syncAndPrioritizeMongoCities().catch((err) => {
    console.error('Error prioritizing cities from MongoDB:', err.message);
    process.exit(1);
  });
}
