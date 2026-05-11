const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const teams = await Team.find({ isActive: true });
  console.log(`Active Teams count: ${teams.length}`);

  let updatedCount = 0;

  for (const team of teams) {
    if (!team.teamLeaderId) continue;
    const leaderId = team.teamLeaderId.toString();

    console.log(`\nProcessing Team: ${team.name} (Leader ID: ${leaderId})`);
    
    for (const memberId of team.memberIds || []) {
      const member = await Employee.findById(memberId);
      if (member) {
        const currentManagerId = member.managerId ? member.managerId.toString() : null;
        if (currentManagerId !== leaderId) {
          console.log(`  -> Updating manager of ${member.name} (${member.code}) from ${currentManagerId} to ${leaderId}`);
          member.managerId = team.teamLeaderId;
          await member.save();
          updatedCount++;
        } else {
          console.log(`  -> ${member.name} already reports correctly to leader.`);
        }
      }
    }
  }

  console.log(`\nHealed ${updatedCount} employee manager associations.`);
  await mongoose.disconnect();
}

run().catch(console.error);
