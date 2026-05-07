const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const ehab = await Employee.findOne({ name: /محمد ايهاب/i });
  console.log('Mohamed Ehab Employee:', ehab ? {
    _id: ehab._id,
    currentTeamId: ehab.currentTeamId,
    teamJoinDate: ehab.teamJoinDate,
    target: ehab.target
  } : 'NOT FOUND');

  const essam = await Employee.findOne({ name: /محمد عصام/i });
  console.log('Mohamed Essam Employee:', essam ? {
    _id: essam._id,
    currentTeamId: essam.currentTeamId,
    teamJoinDate: essam.teamJoinDate,
    target: essam.target
  } : 'NOT FOUND');

  const team = await Team.findOne({ name: /شريف/i });
  console.log('Sherif Team:', team ? {
    _id: team._id,
    memberIds: team.memberIds
  } : 'NOT FOUND');

  const histories = await EmployeeTeamHistory.find({ employeeId: ehab._id });
  console.log('Mohamed Ehab Team Histories:', histories);

  const essamHistories = await EmployeeTeamHistory.find({ employeeId: essam._id });
  console.log('Mohamed Essam Team Histories:', essamHistories);

  await mongoose.disconnect();
}

run().catch(console.error);
