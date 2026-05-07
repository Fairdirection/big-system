const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const teamService = require('../src/services/team.service');
const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
require('../src/models/client.model'); // Register Client schema for populate

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const quarterId = 'Q2-2026';

  // Find Sherif Sabry
  const sherif = await Employee.findOne({ name: /شريف صبرى/i });
  if (!sherif) {
    console.log('Sherif Sabry not found!');
    await mongoose.disconnect();
    return;
  }

  // Find Abdelrahman Khaled
  const abdelrahman = await Employee.findOne({ name: /عبد الرحمن خالد/i });
  if (!abdelrahman) {
    console.log('Abdelrahman Khaled not found!');
    await mongoose.disconnect();
    return;
  }

  console.log('\n======================================');
  console.log('1. Querying Team Leader details (Sherif Sabry)');
  console.log('======================================');
  
  // Find Sherif's team
  const sherifsTeam = await Team.findOne({ teamLeaderId: sherif._id, isActive: true });
  if (sherifsTeam) {
    const sherifTeamSummary = await teamService.getTeamTargetSummary(sherifsTeam._id, quarterId);
    console.log(`Sherif's Team: "${sherifsTeam.name}"`);
    console.log(`Total Target: ${sherifTeamSummary.totalAdjustedTarget} EGP | Total Achieved: ${sherifTeamSummary.totalAchieved} EGP`);
    console.log('Members Progress Detail:');
    sherifTeamSummary.membersProgress.forEach(m => {
      console.log(`  - ${m.name} (${m.code}): Working Days: ${m.actualWorkingDays}, Original Target: ${m.fullTarget} EGP, Adjusted Target: ${m.adjustedTarget} EGP, Achieved: ${m.achieved} EGP`);
    });
  } else {
    console.log('Sherif has no active team!');
  }

  console.log('\n======================================');
  console.log('2. Querying Sales Manager details (Abdelrahman Khaled)');
  console.log('======================================');

  // Query performance list for all teams (which includes Abdelrahman Khaled's team)
  const teamsPerf = await teamService.getTeamsWithPerformance(quarterId);
  const abdelrahmanTeamObj = await Team.findOne({ teamLeaderId: abdelrahman._id, isActive: true });

  if (abdelrahmanTeamObj) {
    const perfForAbdelrahman = teamsPerf.find(t => t._id.toString() === abdelrahmanTeamObj._id.toString());
    if (perfForAbdelrahman) {
      console.log(`Abdelrahman's Team: "${abdelrahmanTeamObj.name}"`);
      console.log(`Total Target: ${perfForAbdelrahman.performance.totalAdjustedTarget} EGP | Total Achieved: ${perfForAbdelrahman.performance.totalAchieved} EGP`);
      console.log('Members Progress Detail:');
      perfForAbdelrahman.performance.membersPerformance.forEach(m => {
        console.log(`  - ${m.name} (${m.code}): Target: ${m.adjustedTarget} EGP, Achieved: ${m.achieved} EGP`);
      });
    } else {
      console.log('Performance not found for Abdelrahman\'s team!');
    }
  } else {
    console.log('Abdelrahman has no active team!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
