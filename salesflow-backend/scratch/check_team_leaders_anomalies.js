const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const teamLeaders = await Employee.find({ seniorityLevel: 'TeamLeader' });
    console.log(`\nFound ${teamLeaders.length} Team Leaders:`);

    for (const tl of teamLeaders) {
      console.log(`- Name: ${tl.name} (${tl.code})`);
      console.log(`  currentTeamId: ${tl.currentTeamId}`);
      console.log(`  managerId: ${tl.managerId}`);

      // Check if they are in any team's memberIds
      const memberOfTeams = await Team.find({ memberIds: tl._id });
      if (memberOfTeams.length > 0) {
        console.log(`  WARNING: Listed as a member of teams:`, memberOfTeams.map(t => `${t.name} (ID: ${t._id})`));
      } else {
        console.log(`  Clean: Not listed as a member of any team.`);
      }

      // Check if they lead a team
      const ledTeams = await Team.find({ teamLeaderId: tl._id, isActive: true });
      console.log(`  Leads active teams:`, ledTeams.map(t => `${t.name} (ID: ${t._id})`));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
