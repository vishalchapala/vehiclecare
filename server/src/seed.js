// Creates demo accounts for development. Run once with:  node src/seed.js
// Passwords come from SEED_PASSWORD in your .env file, never from this code.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  const password = process.env.SEED_PASSWORD;
  if (!process.env.MONGO_URI || !password || password.length < 8) {
    console.error('Set MONGO_URI and a SEED_PASSWORD (at least 8 characters) in .env first');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  const accounts = [
    { name: 'VehicleCare Admin', email: 'admin@vehiclecare.com', phone: '9000000001', role: 'admin' },
    { name: 'Demo Mechanic', email: 'provider@vehiclecare.com', phone: '9000000002', role: 'provider' },
    { name: 'Demo Customer', email: 'customer@vehiclecare.com', phone: '9000000003', role: 'customer' },
  ];

  for (const a of accounts) {
    const exists = await User.findOne({ email: a.email });
    if (exists) { console.log(`Already exists: ${a.email}`); continue; }
    await User.create({ ...a, password, isApproved: true });
    console.log(`Created ${a.role}: ${a.email}`);
  }
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
