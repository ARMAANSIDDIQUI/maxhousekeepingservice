import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/maxhousekeeping';

async function createSupervisorCli() {
  const name = process.argv[2] || 'Rajesh Kumar';
  const email = (process.argv[3] || 'supervisor@maxhousekeeping.com').trim().toLowerCase();
  const password = process.argv[4] || 'Supervisor@123';
  const phone = process.argv[5] || '9876543210';

  console.log(`[Supervisor CLI] Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);

  let existing = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existing) {
    existing.name = name;
    existing.role = 'supervisor';
    existing.email = email;
    existing.phone = phone;
    existing.passwordHash = password;
    existing.emailVerified = true;
    existing.isActive = true;
    await existing.save();
    console.log(`[Supervisor CLI] Successfully updated user "${existing.name}" as SUPERVISOR.`);
    console.log(`  Email: ${email}`);
    console.log(`  Role: supervisor`);
    console.log(`  Login at: /login -> redirected to /supervisor`);
  } else {
    const supervisor = new User({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'supervisor',
      authProvider: 'local',
      emailVerified: true,
      isActive: true,
      avatarUrl: User.generateDefaultAvatar ? User.generateDefaultAvatar(name) : ''
    });

    await supervisor.save();
    console.log(`[Supervisor CLI] Successfully created new field SUPERVISOR:`);
    console.log(`  Name: ${name}`);
    console.log(`  Email: ${email}`);
    console.log(`  Phone: ${phone}`);
    console.log(`  Role: supervisor`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

createSupervisorCli().catch(err => {
  console.error('[Supervisor CLI] Error:', err);
  process.exit(1);
});
