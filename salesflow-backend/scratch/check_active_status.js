const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const ehab = await Employee.findOne({ name: /محمد ايهاب/i });
  console.log('Mohamed Ehab isActive:', ehab ? ehab.isActive : 'NOT FOUND');

  const essam = await Employee.findOne({ name: /محمد عصام/i });
  console.log('Mohamed Essam isActive:', essam ? essam.isActive : 'NOT FOUND');

  await mongoose.disconnect();
}

run().catch(console.error);
