const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const { getTargetProgress } = require('../src/services/employee.service');
const Employee = require('../src/models/employee.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const sherif = await Employee.findOne({ name: /شريف/i });
  if (!sherif) {
    console.log('Sherif not found!');
  } else {
    try {
      const progress = await getTargetProgress(sherif._id.toString(), 'Q2-2026');
      console.log('Sherif Target Progress:', JSON.stringify(progress, null, 2));
    } catch (err) {
      console.error('Error:', err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
