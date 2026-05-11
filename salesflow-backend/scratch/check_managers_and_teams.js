const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const employees = await Employee.find({ department: 'Sales' });
  console.log('--- ALL SALES EMPLOYEES ---');
  employees.forEach(e => {
    console.log(`ID: ${e._id}, Name: ${e.name}, Seniority: ${e.seniorityLevel}, currentTeamId: ${e.currentTeamId}, managerId: ${e.managerId}`);
  });

  const teams = await Team.find();
  console.log('--- ALL TEAMS ---');
  teams.forEach(t => {
    console.log(`ID: ${t._id}, Name: ${t.name}, Leader: ${t.teamLeaderId}, Active: ${t.isActive}, Member count: ${t.memberIds ? t.memberIds.length : 0}, Members: ${JSON.stringify(t.memberIds)}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
