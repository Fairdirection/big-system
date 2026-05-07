const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const { getTeamTargetSummary } = require('../src/services/team.service');
const Team = require('../src/models/team.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const team = await Team.findOne({ name: /شريف/i });
  if (!team) {
    console.log('Sherif Team not found!');
  } else {
    try {
      const summary = await getTeamTargetSummary(team._id.toString(), 'Q2-2026');
      console.log('Sherif Team Target Summary:', JSON.stringify(summary, null, 2));
    } catch (err) {
      console.error('Error:', err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
