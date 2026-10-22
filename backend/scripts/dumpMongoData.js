import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Category from '../src/models/Category.js';
import Service from '../src/models/Service.js';

async function dump() {
  await mongoose.connect(process.env.MONGODB_URI);
  const categories = await Category.find().lean();
  const services = await Service.find().lean();
  
  const outputPath = path.resolve(__dirname, 'current_mongo_data.json');
  fs.writeFileSync(outputPath, JSON.stringify({ categories, services }, null, 2));
  console.log(`Saved ${categories.length} categories and ${services.length} services to ${outputPath}`);
  await mongoose.disconnect();
}

dump().catch(console.error);
