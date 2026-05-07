const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const { getTeamMemberPerformance } = require('../src/services/team.service');
const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const ehab = await Employee.findOne({ name: /محمد ايهاب/i });
  const team = await Team.findOne({ name: /شريف/i });

  if (ehab && team) {
    const perf = await getTeamMemberPerformance(ehab._id.toString(), team._id.toString(), 'Q2-2026');
    console.log('Mohamed Ehab Team Performance:', perf);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
