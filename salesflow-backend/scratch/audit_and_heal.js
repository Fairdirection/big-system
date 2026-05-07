const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const teams = await Team.find({ isActive: true });
  const employees = await Employee.find({ isActive: true });

  console.log(`Auditing ${teams.length} teams and ${employees.length} employees...`);

  for (const team of teams) {
    let modified = false;
    const cleanMemberIds = [];

    for (const memberId of team.memberIds) {
      const emp = employees.find(e => e._id.toString() === memberId.toString());
      if (!emp) {
        console.log(`[Warning] Team "${team.name}" has member ID ${memberId} who does not exist or is inactive. Removing...`);
        modified = true;
        continue;
      }

      if (!emp.currentTeamId || emp.currentTeamId.toString() !== team._id.toString()) {
        console.log(`[Mismatch] Team "${team.name}" has member "${emp.name}" (${emp.code}) but employee currentTeamId is "${emp.currentTeamId}". Removing from team list...`);
        modified = true;
        continue;
      }

      cleanMemberIds.push(memberId);
    }

    if (modified) {
      team.memberIds = cleanMemberIds;
      await team.save();
      console.log(`[Healed] Updated Team "${team.name}" member list to:`, cleanMemberIds);
    }
  }

  // Also check if any employee thinks they are in a team, but the team doesn't list them
  for (const emp of employees) {
    if (emp.currentTeamId) {
      const team = teams.find(t => t._id.toString() === emp.currentTeamId.toString());
      if (!team) {
        console.log(`[Mismatch] Employee "${emp.name}" (${emp.code}) points to team ID ${emp.currentTeamId} which does not exist or is inactive. Clearing...`);
        emp.currentTeamId = null;
        emp.teamJoinDate = null;
        await emp.save();
      } else if (!team.memberIds.some(m => m.toString() === emp._id.toString()) && team.teamLeaderId.toString() !== emp._id.toString()) {
        console.log(`[Mismatch] Employee "${emp.name}" (${emp.code}) points to team "${team.name}" but is not listed in its memberIds. Adding back...`);
        team.memberIds.push(emp._id);
        await team.save();
      }
    }
  }

  console.log('Database audit and self-healing complete!');
  await mongoose.disconnect();
}

run().catch(console.error);
