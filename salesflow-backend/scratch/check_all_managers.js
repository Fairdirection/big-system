const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const managers = await Employee.find({ seniorityLevel: 'SalesManager' });
  console.log(`Found ${managers.length} Sales Managers:`);
  for (const m of managers) {
    console.log(`- Manager ID: ${m._id}, Name: ${m.name}, isActive: ${m.isActive}`);
    const teams = await Team.find({ teamLeaderId: m._id });
    for (const t of teams) {
      console.log(`  * Team ID: ${t._id}, Name: ${t.name}, isActive: ${t.isActive}, memberIds:`, t.memberIds);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
