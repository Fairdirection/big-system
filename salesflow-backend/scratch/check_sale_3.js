const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Sale = require('../src/models/sale.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const s3 = await Sale.findOne({ saleNumber: 'SALE-0003' });
  console.log('SALE-0003 fields:', s3);

  await mongoose.disconnect();
}

run().catch(console.error);
