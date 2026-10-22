#!/usr/bin/env node
/**
 * Cryptographic Hash & Secret Key Generator Utility
 * Generates secure hashing strings and high-entropy secret keys for .env configuration.
 *
 * Usage:
 *   node scripts/generateHashOrSecret.js
 *   node scripts/generateHashOrSecret.js "MyCustomPasswordOrString"
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function run() {
  const inputArg = process.argv[2];

  console.log('\n=============================================================');
  console.log('   MAX HOUSEKEEPING - CRYPTO HASH & SECRET GENERATOR');
  console.log('=============================================================\n');

  if (inputArg) {
    const rawString = String(inputArg);
    console.log(`[Input String]: "${rawString}"\n`);

    // 1. Bcrypt Hash (12 rounds - used by User passwords in this project)
    const saltRounds = 12;
    const bcryptHash = await bcrypt.hash(rawString, saltRounds);

    // 2. Scrypt Key Derivation (N=16384, r=8, p=1, keylen=64)
    const salt = crypto.randomBytes(16);
    const scryptBuffer = crypto.scryptSync(rawString, salt, 64);
    const scryptHash = `$scrypt$${salt.toString('hex')}$${scryptBuffer.toString('hex')}`;

    // 3. SHA-256 Digest
    const sha256Hex = crypto.createHash('sha256').update(rawString).digest('hex');

    // 4. SHA-512 Digest
    const sha512Hex = crypto.createHash('sha512').update(rawString).digest('hex');

    console.log('--- 1. Bcrypt Hash (Recommended for Password Storage in DB/ENV) ---');
    console.log(`BCRYPT_HASH=${bcryptHash}\n`);

    console.log('--- 2. Scrypt Hash (Key Derivation Function) ---');
    console.log(`SCRYPT_HASH=${scryptHash}\n`);

    console.log('--- 3. SHA-256 Hash ---');
    console.log(`SHA256_HASH=${sha256Hex}\n`);

    console.log('--- 4. SHA-512 Hash ---');
    console.log(`SHA512_HASH=${sha512Hex}\n`);

    console.log('=============================================================');
    console.log('Copy the line you need directly into your backend/.env file!');
    console.log('=============================================================\n');
  } else {
    // Generate high-entropy secrets for JWT_SECRET or Session encryption
    const secret256 = crypto.randomBytes(32).toString('hex'); // 64 chars
    const secret512 = crypto.randomBytes(64).toString('hex'); // 128 chars
    const secretBase64 = crypto.randomBytes(32).toString('base64'); // 44 chars
    
    // Sample random secure password + its bcrypt hash
    const randomPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, 'A') + '@' + crypto.randomInt(100, 999);
    const sampleBcrypt = await bcrypt.hash(randomPassword, 12);

    console.log('--- 1. Secure 256-bit Hex Token (Best for JWT_SECRET in .env) ---');
    console.log(`JWT_SECRET=${secret256}\n`);

    console.log('--- 2. Ultra-Secure 512-bit Hex Token ---');
    console.log(`JWT_SECRET_512=${secret512}\n`);

    console.log('--- 3. 32-Byte Base64 Token ---');
    console.log(`SESSION_SECRET=${secretBase64}\n`);

    console.log('--- 4. Generated Random Password & Bcrypt Hash ---');
    console.log(`PLAIN_PASSWORD=${randomPassword}`);
    console.log(`PASSWORD_HASH=${sampleBcrypt}\n`);

    console.log('=============================================================');
    console.log('TIP: To hash a specific password or string, run:');
    console.log('  node scripts/generateHashOrSecret.js "YourPasswordHere"');
    console.log('=============================================================\n');
  }
}

run().catch((err) => {
  console.error('[Error generating hash]:', err.message);
  process.exit(1);
});
