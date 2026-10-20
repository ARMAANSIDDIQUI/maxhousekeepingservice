import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/maxhousekeeping';

async function makeAdmin() {
  const targetEmail = (process.argv[2] || 'admin@dummy.com').trim().toLowerCase();
  const customPassword = process.argv[3] || process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';

  console.log(`[Admin Seeder] Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`[Admin Seeder] Connected successfully.`);

  let user = await User.findOne({
    $or: [
      { email: targetEmail },
      { phone: targetEmail }
    ]
  });

  if (user) {
    user.role = 'admin';
    user.emailVerified = true;
    user.passwordHash = customPassword;
    await user.save();
    console.log(`[Admin Seeder] Success: User "${user.name}" (${user.email || user.phone}) is an ADMIN with updated credentials.`);
  } else {
    console.log(`[Admin Seeder] Creating new admin account for "${targetEmail}"...`);

    // Choose a safe, unique phone number to prevent E11000 duplicate key error
    let assignedPhone = '9999900001';
    let phoneExists = await User.findOne({ phone: assignedPhone });
    let counter = 1;
    while (phoneExists) {
      counter++;
      assignedPhone = `99999${String(counter).padStart(5, '0')}`;
      phoneExists = await User.findOne({ phone: assignedPhone });
    }

    user = new User({
      name: 'Max Admin',
      email: targetEmail,
      phone: assignedPhone,
      passwordHash: customPassword,
      role: 'admin',
      authProvider: 'local',
      emailVerified: true,
      avatarUrl: User.generateDefaultAvatar('Admin')
    });

    await user.save();
    console.log(`[Admin Seeder] Created new dummy admin user:`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Phone:    ${user.phone}`);
    console.log(`  Role:     ${user.role}`);
    console.log(`  Password: ${customPassword}`);
  }

  await mongoose.disconnect();
  console.log('[Admin Seeder] Finished.');
}

makeAdmin().catch(err => {
  console.error('[Admin Seeder Error]:', err.message);
  process.exit(1);
});
