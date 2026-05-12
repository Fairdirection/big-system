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
  console.log('Mariam Tamer:', mariam ? {
    _id: mariam._id,
    name: mariam.name,
    currentTeamId: mariam.currentTeamId,
    isActive: mariam.isActive,
    department: mariam.department,
    seniorityLevel: mariam.seniorityLevel
  } : 'NOT FOUND');

  const sherif = await Employee.findOne({ name: /شريف/i });
  console.log('Sherif Sabry:', sherif ? {
    _id: sherif._id,
    name: sherif.name,
    currentTeamId: sherif.currentTeamId
  } : 'NOT FOUND');

  if (sherif) {
    const teams = await Team.find({ teamLeaderId: sherif._id });
    console.log('Sherif Teams:');
    for (const t of teams) {
      console.log(`- Team ID: ${t._id}, Name: ${t.name}, isActive: ${t.isActive}, memberIds:`, t.memberIds);
    }
  }

  if (mariam) {
    const histories = await EmployeeTeamHistory.find({ employeeId: mariam._id });
    console.log('Mariam Histories:', histories);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
