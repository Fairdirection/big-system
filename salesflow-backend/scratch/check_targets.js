const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
const employeeService = require('../src/services/employee.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const abdelrahman = await Employee.findOne({ name: 'عبد الرحمن خالد' });
  const sherif = await Employee.findOne({ name: 'شريف صبرى' });

  if (abdelrahman) {
    console.log(`\n=== Abdel Rahman Khaled (Sales Manager) ===`);
    console.log(`ID: ${abdelrahman._id}`);
    console.log(`Personal Target: ${abdelrahman.target}`);
    
    const teamLeaders = await Employee.find({
      managerId: abdelrahman._id,
      seniorityLevel: 'TeamLeader',
      isActive: true
    });
    console.log(`Reporting Team Leaders count: ${teamLeaders.length}`);
    for (const tl of teamLeaders) {
      console.log(`  - Team Leader: ${tl.name} (${tl.code})`);
      const lp = await employeeService.getTargetProgress(tl._id.toString(), 'Q2-2026');
      console.log(`    Full Target: ${lp.fullTarget}`);
      console.log(`    Adjusted Target: ${lp.adjustedTarget}`);
    }

    const progress = await employeeService.getTargetProgress(abdelrahman._id.toString(), 'Q2-2026');
    console.log(`Aggregated Full Target: ${progress.fullTarget}`);
    console.log(`Aggregated Adjusted Target: ${progress.adjustedTarget}`);
  }

  if (sherif) {
    console.log(`\n=== Sherif Sabry (Team Leader) ===`);
    console.log(`ID: ${sherif._id}`);
    console.log(`Personal Target: ${sherif.target}`);

    const team = await Team.findOne({ teamLeaderId: sherif._id, isActive: true }).populate('memberIds');
    if (team) {
      console.log(`Active Team Led: ${team.name}`);
      console.log(`Members count: ${team.memberIds.length}`);
      for (const m of team.memberIds) {
        console.log(`  - Member: ${m.name} (${m.code})`);
        const mp = await employeeService.getTargetProgress(m._id.toString(), 'Q2-2026');
        console.log(`    Full Target: ${mp.fullTarget}`);
        console.log(`    Adjusted Target: ${mp.adjustedTarget}`);
      }
    } else {
      console.log(`No active team led by Sherif Sabry!`);
    }

    const progress = await employeeService.getTargetProgress(sherif._id.toString(), 'Q2-2026');
    console.log(`Aggregated Full Target: ${progress.fullTarget}`);
    console.log(`Aggregated Adjusted Target: ${progress.adjustedTarget}`);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from DB');
}

run().catch(console.error);
