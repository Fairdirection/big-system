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
  const correctTeamId = new mongoose.Types.ObjectId('6a0329cf757eafbdcfba8bab');

  if (!mariam) {
    console.log('Mariam not found');
    await mongoose.disconnect();
    return;
  }

  // Find incorrect team
  const incorrectTeamId = new mongoose.Types.ObjectId('69fc7abb0833cf6acad724db');

  // Pull Mariam from incorrect team if she was added
  await Team.findByIdAndUpdate(incorrectTeamId, { $pull: { memberIds: mariam._id } });
  console.log('Pulled Mariam from incorrect team');

  // Set leaveDate to null for Sherif's correct team history
  const historyResult = await EmployeeTeamHistory.updateMany(
    { employeeId: mariam._id, teamId: correctTeamId },
    { $set: { leaveDate: null, quarterId: 'Q1-2026' } }
  );
  console.log('Updated histories:', historyResult);

  // Update employee record
  mariam.currentTeamId = correctTeamId;
  mariam.teamJoinDate = new Date('2026-01-01');
  await mariam.save();
  console.log('Updated Mariam currentTeamId to correct team ID');

  // Add to correct team's memberIds
  await Team.findByIdAndUpdate(correctTeamId, { $addToSet: { memberIds: mariam._id } });
  console.log('Added Mariam to correct team memberIds');

  await mongoose.disconnect();
}

run().catch(console.error);
