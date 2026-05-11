const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const teams = await Team.find({ isActive: true }).populate('teamLeaderId').populate('memberIds');
  console.log(`Active Teams count: ${teams.length}`);
  for (const team of teams) {
    console.log(`\nTeam Name: ${team.name}`);
    console.log(`ID: ${team._id}`);
    console.log(`Leader: ${team.teamLeaderId ? team.teamLeaderId.name : 'None'} (${team.teamLeaderId ? team.teamLeaderId.seniorityLevel : 'N/A'})`);
    console.log(`Members count: ${team.memberIds.length}`);
    for (const m of team.memberIds) {
      console.log(`  - ${m.name} (${m.seniorityLevel}) [ID: ${m._id}]`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
