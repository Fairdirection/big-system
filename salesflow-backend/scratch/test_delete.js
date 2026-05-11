const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const { deleteEmployee } = require('../src/services/employee.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const empId = '6a01a0b45ef1703a2914b73a';
  try {
    const result = await deleteEmployee(empId);
    console.log('Delete successful! Result:', result);
  } catch (err) {
    console.error('Delete failed with error:', err);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
