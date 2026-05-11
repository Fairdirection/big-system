const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');
const { getQuarterBounds, calculateWorkingDays, calculateEmployeeQuarterDays } = require('../src/utils/quarter.utils');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const sherif = await Employee.findOne({ name: 'شريف صبرى' });
  const team = await Team.findOne({ teamLeaderId: sherif._id, isActive: true }).populate('memberIds');

  console.log(`\n=== SHERIF SABRY TEAM MEMBERS EXACT MATH ===`);
  console.log(`Team Name: ${team.name}`);
  console.log(`Quarter: Q2-2026`);

  const { start: qStart, end: qEnd } = getQuarterBounds('Q2-2026');
  console.log(`Quarter Start: ${qStart.toISOString().split('T')[0]}`);
  console.log(`Quarter End: ${qEnd.toISOString().split('T')[0]}`);

  let teamCardSum = 0;
  let overallSum = 0;

  for (const m of team.memberIds) {
    console.log(`\n--------------------------------------------`);
    console.log(`Employee: ${m.name} (${m.code})`);
    console.log(`Base Target: ${m.target} EGP`);
    console.log(`Hire Date: ${m.hireDate.toISOString().split('T')[0]}`);

    // Fetch history
    const histories = await EmployeeTeamHistory.find({
      employeeId: m._id,
      teamId: team._id,
      quarterId: 'Q2-2026'
    }).lean();

    console.log(`History records in Sherif's team: ${histories.length}`);
    for (const h of histories) {
      console.log(`  - Joined: ${h.joinDate.toISOString().split('T')[0]}, Left: ${h.leaveDate ? h.leaveDate.toISOString().split('T')[0] : 'None (Active)'}`);
    }

    // 1. Team Card Calculation (getTeamMemberPerformance)
    let teamWorkingDays = 0;
    if (histories.length > 0) {
      for (const h of histories) {
        const joinDateObj = new Date(h.joinDate);
        joinDateObj.setHours(0, 0, 0, 0);
        const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

        const leaveDate = h.leaveDate ? h.leaveDate : qEnd;
        const leaveDateObj = new Date(leaveDate);
        leaveDateObj.setHours(23, 59, 59, 999);
        const effEnd = new Date(Math.min(qEnd.getTime(), leaveDateObj.getTime()));

        if (effEnd >= effStart) {
          teamWorkingDays += calculateWorkingDays(effStart, effEnd);
        }
      }
    } else {
      const joinDateObj = new Date(m.teamJoinDate || m.createdAt);
      joinDateObj.setHours(0, 0, 0, 0);
      const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

      const endDateObj = new Date(qEnd);
      endDateObj.setHours(23, 59, 59, 999);
      const effEnd = new Date(Math.min(qEnd.getTime(), endDateObj.getTime()));

      if (effEnd >= effStart) {
        teamWorkingDays = calculateWorkingDays(effStart, effEnd);
      }
    }

    const teamCardTarget = (m.target / 90) * teamWorkingDays;
    teamCardSum += Math.round(teamCardTarget);
    console.log(`  => Team Card Math:`);
    console.log(`     Working Days in Team = ${teamWorkingDays} days`);
    console.log(`     Formula: (${m.target} / 90) * ${teamWorkingDays}`);
    console.log(`     Result (Rounded) = ${Math.round(teamCardTarget)} EGP`);

    // 2. Overall Quarter Calculation (getTargetProgress)
    const allHistories = await EmployeeTeamHistory.find({
      employeeId: m._id,
      quarterId: 'Q2-2026'
    }).lean();

    let overallWorkingDays = 0;
    if (allHistories.length > 0) {
      overallWorkingDays = calculateEmployeeQuarterDays(allHistories, 'Q2-2026');
    } else {
      const joinDateObj = new Date(m.hireDate || m.createdAt);
      joinDateObj.setHours(0, 0, 0, 0);
      const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

      const endDateObj = new Date(qEnd);
      endDateObj.setHours(23, 59, 59, 999);
      const effEnd = new Date(Math.min(qEnd.getTime(), endDateObj.getTime()));

      if (effEnd >= effStart) {
        overallWorkingDays = calculateWorkingDays(effStart, effEnd);
      }
    }

    const overallTarget = (m.target / 90) * overallWorkingDays;
    overallSum += Math.round(overallTarget);
    console.log(`  => Overall Quarter Math:`);
    console.log(`     Total Quarter Working Days = ${overallWorkingDays} days`);
    console.log(`     Formula: (${m.target} / 90) * ${overallWorkingDays}`);
    console.log(`     Result (Rounded) = ${Math.round(overallTarget)} EGP`);
  }

  console.log(`\n============================================`);
  console.log(`TOTALS SUMS:`);
  console.log(`Team Card Sum (Sherif Sabry's Team Card Target): ${teamCardSum} EGP`);
  console.log(`Overall Quarter Sum (Abdel Rahman's Manager Card Target): ${overallSum} EGP`);

  await mongoose.disconnect();
}

run().catch(console.error);
