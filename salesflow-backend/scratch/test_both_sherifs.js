const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

// Register all models
require('../src/models/user.model');
require('../src/models/setting.model');
require('../src/models/client.model');
require('../src/models/employee.model');
require('../src/models/employee-team-history.model');
require('../src/models/sale.model');
require('../src/models/claim.model');
require('../src/models/team.model');

const { getTeamTargetSummary } = require('../src/services/team.service');
const Team = require('../src/models/team.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const teams = await Team.find({ name: /شريف/i });
  console.log(`Found ${teams.length} teams matching "شريف"`);

  for (const t of teams) {
    console.log(`\n--- Team: ${t.name} (ID: ${t._id}), isActive: ${t.isActive} ---`);
    try {
      const summaryQ1 = await getTeamTargetSummary(t._id.toString(), 'Q1-2026');
      console.log('Q1-2026 Summary membersProgress count:', summaryQ1.membersProgress.length);
      console.log('Q1-2026 Summary:', JSON.stringify(summaryQ1, null, 2));

      const summaryQ2 = await getTeamTargetSummary(t._id.toString(), 'Q2-2026');
      console.log('Q2-2026 Summary membersProgress count:', summaryQ2.membersProgress.length);
      console.log('Q2-2026 Summary:', JSON.stringify(summaryQ2, null, 2));
    } catch (err) {
      console.error('Error for team:', err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
