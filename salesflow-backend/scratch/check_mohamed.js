const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');
const Sale = require('../src/models/sale.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // 1. Find Mohamed Ehab
  const ehab = await Employee.findOne({ name: /محمد ايهاب/i });
  if (!ehab) {
    console.log('Mohamed Ehab not found!');
  } else {
    console.log('Mohamed Ehab Employee Record:', {
      _id: ehab._id,
      name: ehab.name,
      code: ehab.code,
      currentTeamId: ehab.currentTeamId,
      teamJoinDate: ehab.teamJoinDate,
      isActive: ehab.isActive
    });
  }

  // 2. Find Sherif (Team Leader)
  const sherif = await Employee.findOne({ name: /شريف/i });
  if (!sherif) {
    console.log('Sherif not found!');
  } else {
    console.log('Sherif Employee Record:', {
      _id: sherif._id,
      name: sherif.name,
      code: sherif.code,
      currentTeamId: sherif.currentTeamId
    });
  }

  // 3. Find Sherif's Team
  const team = await Team.findOne({ name: /شريف/i });
  if (!team) {
    console.log('Sherif\'s team not found!');
  } else {
    console.log('Sherif\'s Team Record:', {
      _id: team._id,
      name: team.name,
      teamLeaderId: team.teamLeaderId,
      memberIds: team.memberIds,
      isActive: team.isActive
    });
  }

  // 4. Find all EmployeeTeamHistory for Mohamed Ehab
  if (ehab) {
    const histories = await EmployeeTeamHistory.find({ employeeId: ehab._id });
    console.log('Mohamed Ehab histories count:', histories.length);
    histories.forEach((h, i) => {
      console.log(`History #${i+1}:`, {
        _id: h._id,
        teamId: h.teamId,
        joinDate: h.joinDate,
        leaveDate: h.leaveDate,
        quarterId: h.quarterId
      });
    });
  }

  // 5. Find sales where Mohamed Ehab is listed as seller
  if (ehab) {
    const sales = await Sale.find({ 'sellers.employeeId': ehab._id });
    console.log('Sales count for Mohamed Ehab:', sales.length);
    sales.forEach((s, i) => {
      console.log(`Sale #${i+1}:`, {
        _id: s._id,
        saleNumber: s.saleNumber,
        projectName: s.projectName,
        unitValue: s.unitValue,
        contractDate: s.contractDate,
        status: s.status,
        sellers: s.sellers
      });
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
