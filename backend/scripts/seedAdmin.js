// Creates the first ADMIN account for development, from credentials in
// backend/.env (SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
// Safe to run more than once - if an account with that email already
// exists, it does nothing. Never prints the password.
//
// Run with: npm run seed:admin

const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const env = require('../src/config/env');
const User = require('../src/models/User');
const { hashPassword } = require('../src/modules/auth/auth.service');

async function run() {
  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = env;

  if (!SEED_ADMIN_NAME || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.error(
      'SEED_ADMIN_NAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must all be set in backend/.env'
    );
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = SEED_ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    console.log(`An account already exists for ${normalizedEmail}. No changes made.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await hashPassword(SEED_ADMIN_PASSWORD);

  const admin = await User.create({
    name: SEED_ADMIN_NAME,
    email: normalizedEmail,
    passwordHash,
    role: 'ADMIN',
  });

  console.log('Admin account created successfully:');
  console.log(`  name:  ${admin.name}`);
  console.log(`  email: ${admin.email}`);
  console.log('  password: (not shown here - use the SEED_ADMIN_PASSWORD value from your .env)');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed admin account:', err.message);
  process.exit(1);
});
