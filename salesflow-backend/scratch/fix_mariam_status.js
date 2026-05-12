const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const mariam = await Employee.findOne({ name: /مريم تامر/i });
  const team = await Team.findOne({ name: /شريف/i });

  if (!mariam || !team) {
    console.log('Mariam or Team not found');
    await mongoose.disconnect();
    return;
  }

  console.log('Mariam ID:', mariam._id);
  console.log('Team ID:', team._id);

  // 1. Clear leaveDate in Mariam's history record to make her active in Sherif's team
  const historyResult = await EmployeeTeamHistory.updateMany(
    { employeeId: mariam._id, teamId: team._id },
    { $set: { leaveDate: null, quarterId: 'Q1-2026' } }
  );
  console.log('Updated histories:', historyResult);

  // 2. Update Employee's currentTeamId and teamJoinDate
  mariam.currentTeamId = team._id;
  mariam.teamJoinDate = new Date('2026-01-01');
  await mariam.save();
  console.log('Updated Mariam employee record');

  // 3. Add to Team memberIds array
  await Team.findByIdAndUpdate(team._id, { $addToSet: { memberIds: mariam._id } });
  console.log('Added Mariam to team memberIds');

  // Double check team count
  const updatedTeam = await Team.findById(team._id);
  console.log('Updated Team memberIds:', updatedTeam.memberIds);

  await mongoose.disconnect();
}

run().catch(console.error);
