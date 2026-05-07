const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const { getDashboardStats } = require('../src/services/dashboard.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    const stats = await getDashboardStats('Q2-2026');
    console.log('Successfully fetched dashboard stats!');
    console.log('Overview:', stats.overview);
    console.log('Team Rankings (Count):', stats.teamRanking.length);
    stats.teamRanking.forEach((team, i) => {
      console.log(`Team #${i+1}: ${team.teamName} | Achieved: ${team.achieved} | Members count: ${team.membersPerformance.length}`);
      team.membersPerformance.forEach(member => {
        console.log(`   - Member: ${member.name} | Achieved in team context: ${member.achieved}`);
      });
    });
  } catch (error) {
    console.error('Error during test:', error);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
