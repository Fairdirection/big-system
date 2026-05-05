require('dotenv').config();
const mongoose = require('mongoose');
const seedSettings = require('../seed/settings.seed');

const dbUri = process.env.MONGODB_URI;

async function run() {
  try {
    console.log('Connecting to:', dbUri.split('@')[1]); // Log only the host part for safety
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');
    await seedSettings();
    console.log('Settings seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
