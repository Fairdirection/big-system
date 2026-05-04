require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const seedSettings = require('./settings.seed');
const seedUsers = require('./users.seed');
const seedMockData = require('./mock-data.seed');

const runSeeds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    await seedSettings();
    await seedUsers();
    await seedMockData();

    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

runSeeds();
