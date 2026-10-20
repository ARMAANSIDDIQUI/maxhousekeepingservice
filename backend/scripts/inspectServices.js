import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Service from '../src/models/Service.js';

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  const services = await Service.find().select('title slug price mrp matrix optionGroups');
  console.log(`Found ${services.length} services in MongoDB:`);
  for (const s of services) {
    console.log(`- ${s.title} (${s.slug}) | Base Price: ₹${s.price} (MRP: ₹${s.mrp}) | Matrix rows: ${s.matrix?.length || 0} | Option groups: ${s.optionGroups?.length || 0}`);
  }
  await mongoose.disconnect();
}

inspect().catch(console.error);
