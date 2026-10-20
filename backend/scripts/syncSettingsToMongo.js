import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Settings from '../src/models/Settings.js';

async function syncSettings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas successfully.');

  const updateData = {
    brandName: 'Max House Keeping Service',
    businessName: 'Max House Keeping Service',
    tagline: 'A spotless home, without lifting a finger.',
    heroCopy: 'Book trained, background-verified cleaning professionals for your home or office.',
    phone: '+91 98977 66002',
    primaryPhone: '+91 98977 66002',
    alternatePhone: '+91 82105 23309',
    secondaryPhone: '+91 82105 23309',
    whatsappNumber: '+91 98977 66002',
    email: 'vikasmax321@gmail.com',
    supportEmail: 'vikasmax321@gmail.com',
    address: 'Kanth road Behind, Asian Vivekanand Hospital, Moradabad, Uttar Pradesh 244001',
    workingHours: '8:00 AM – 8:00 PM (Monday – Sunday)',
    ratingClaim: 'Rated 4.9/5 by 10,000+ happy homes'
  };

  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✓ Successfully uploaded and synced Business & Operational Settings in MongoDB:');
  console.log(JSON.stringify({
    brandName: settings.brandName,
    email: settings.email,
    phone: settings.phone,
    alternatePhone: settings.alternatePhone,
    whatsappNumber: settings.whatsappNumber,
    workingHours: settings.workingHours,
    address: settings.address
  }, null, 2));

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

syncSettings().catch((err) => {
  console.error('Failed to update settings in MongoDB:', err);
  process.exit(1);
});
