import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import User from '../models/User.js';

async function migrate() {
  try {
    await connectDB();
    console.log('Connected to DB for migration');

    // 1. Drop existing phone_1 index if it exists
    try {
      await User.collection.dropIndex('phone_1');
      console.log('Successfully dropped old phone_1 index');
    } catch (e) {
      console.log('Drop index note:', e.message);
    }

    // 2. Clean up dummy 'g_' phone numbers
    const result = await User.collection.updateMany(
      { phone: { $regex: '^g_' } },
      { $set: { phone: '' } }
    );
    console.log('Cleaned up dummy g_ phones count:', result.modifiedCount);

    // 3. Create partial unique index: unique ONLY when phone is a non-empty string
    await User.collection.createIndex(
      { phone: 1 },
      {
        unique: true,
        partialFilterExpression: { phone: { $type: 'string', $gt: '' } },
        name: 'phone_1'
      }
    );
    console.log('Created new partial unique index for phone');

    const indexes = await User.collection.indexes();
    console.log('NEW INDEXES:', JSON.stringify(indexes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
