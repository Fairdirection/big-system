const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const abdelrahman = await Employee.findOne({ name: /عبد الرحمن خالد/ });
  console.log('Abdel Rahman Khaled:', abdelrahman);

  const sherif = await Employee.findOne({ name: /شريف صبرى/ });
  console.log('Sherif Sabry:', sherif);

  const teams = await Team.find({ teamLeaderId: { $in: [abdelrahman._id, sherif._id] } });
  console.log('Teams for Abdel Rahman and Sherif:');
  for (const t of teams) {
    console.log(`- Team ID: ${t._id}, Name: ${t.name}, Leader: ${t.teamLeaderId}, isActive: ${t.isActive}, memberIds:`, t.memberIds);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
