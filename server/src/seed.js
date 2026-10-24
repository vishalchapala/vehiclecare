// Creates demo accounts for development. Run once with:  node src/seed.js
// Passwords come from SEED_PASSWORD in your .env file, never from this code.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ServiceCategory = require('./models/ServiceCategory');

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
  const services = [
    { name: 'Periodic service', description: 'Full routine service with fluids and filters checked', estimatedPrice: 2500 },
    { name: 'Oil change', description: 'Engine oil and oil filter replacement', estimatedPrice: 1200 },
    { name: 'Brake inspection', description: 'Brake pads, discs and fluid check', estimatedPrice: 800 },
    { name: 'Tyre rotation and alignment', description: 'Wheel alignment and tyre rotation', estimatedPrice: 900 },
    { name: 'Battery check', description: 'Battery health test and terminal cleaning', estimatedPrice: 300 },
    { name: 'AC service', description: 'Air conditioning check and gas top-up', estimatedPrice: 1800 },
    { name: 'General inspection', description: 'Multi-point vehicle health check', estimatedPrice: 500 },
  ];
  for (const sv of services) {
    if (await ServiceCategory.findOne({ name: sv.name })) { console.log(`Already exists: ${sv.name}`); continue; }
    await ServiceCategory.create(sv);
    console.log(`Created service: ${sv.name}`);
  }
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
