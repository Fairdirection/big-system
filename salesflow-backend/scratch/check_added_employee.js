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

  const emp = await Employee.findOne({ name: '23434534534534' });
  if (emp) {
    console.log('Employee details:', JSON.stringify(emp, null, 2));
    const histories = await EmployeeTeamHistory.find({ employeeId: emp._id });
    console.log('Team History records for this employee:', JSON.stringify(histories, null, 2));
  } else {
    console.log('Employee 23434534534534 not found!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
