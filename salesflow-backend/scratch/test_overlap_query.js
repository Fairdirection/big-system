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

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');
const { getQuarterBounds } = require('../src/utils/quarter.utils');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const mariam = await Employee.findOne({ name: /مريم تامر/i });
  const team = await Team.findOne({ name: /شريف/i, isActive: true });

  if (!mariam || !team) {
    console.log('Mariam or Team not found');
    await mongoose.disconnect();
    return;
  }

  console.log('Found Team:', team.name, 'ID:', team._id);

  // Temporary simulate "Mariam left team today"
  console.log('Setting Mariam leaveDate to 2026-05-12 (Today) and removing from Team.memberIds...');
  await EmployeeTeamHistory.updateMany(
    { employeeId: mariam._id, teamId: team._id },
    { $set: { leaveDate: new Date('2026-05-12T00:00:00.000Z') } }
  );
  await Team.findByIdAndUpdate(team._id, { $pull: { memberIds: mariam._id } });
  await Employee.findByIdAndUpdate(mariam._id, { $set: { currentTeamId: null } });

  const quarterId = 'Q2-2026';
  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);

  console.log('\n--- 1. Testing Legacy Query (quarterId: "Q2-2026") ---');
  const legacyHistories = await EmployeeTeamHistory.find({ teamId: team._id, quarterId });
  console.log('Legacy histories found:', legacyHistories.length);
  for (const h of legacyHistories) {
    console.log(`- Employee: ${h.employeeId}, joinDate: ${h.joinDate}, leaveDate: ${h.leaveDate}, quarterId: ${h.quarterId}`);
  }

  console.log('\n--- 2. Testing New Overlapping Dates Query ---');
  const newHistories = await EmployeeTeamHistory.find({
    teamId: team._id,
    joinDate: { $lte: qEnd },
    $or: [
      { leaveDate: null },
      { leaveDate: { $gte: qStart } }
    ]
  });
  console.log('New overlapping histories found:', newHistories.length);
  for (const h of newHistories) {
    console.log(`- Employee: ${h.employeeId}, joinDate: ${h.joinDate}, leaveDate: ${h.leaveDate}, quarterId: ${h.quarterId}`);
  }

  // Restore Mariam back to active state for general system operation
  console.log('\nRestoring Mariam back to active state...');
  await EmployeeTeamHistory.updateMany(
    { employeeId: mariam._id, teamId: team._id },
    { $set: { leaveDate: null } }
  );
  await Team.findByIdAndUpdate(team._id, { $addToSet: { memberIds: mariam._id } });
  await Employee.findByIdAndUpdate(mariam._id, { $set: { currentTeamId: team._id } });

  await mongoose.disconnect();
}

run().catch(console.error);
