const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');
const Sale = require('../src/models/sale.model');
const { deleteEmployee } = require('../src/services/employee.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Create a mock team leader first to be the manager
  const manager = await Employee.create({
    code: 'EMP-TMANAGER',
    name: 'Test Manager Delete',
    nationalId: '99999999999991',
    department: 'Sales',
    jobTitle: 'Team Leader',
    seniorityLevel: 'TeamLeader',
    hireDate: new Date(),
    managerId: new mongoose.Types.ObjectId(),
    email: 'testmanagerdelete@gmail.com',
    phone: '01122334455'
  });

  // Create a mock team
  const team = await Team.create({
    name: 'Test Team Delete',
    teamLeaderId: manager._id,
    memberIds: []
  });

  // Create employee to delete
  const employee = await Employee.create({
    code: 'EMP-TDELETE',
    name: 'Test Employee Delete',
    nationalId: '99999999999992',
    department: 'Sales',
    jobTitle: 'Seller',
    seniorityLevel: 'BC',
    hireDate: new Date(),
    managerId: manager._id,
    currentTeamId: team._id,
    email: 'testemployeedelete@gmail.com',
    phone: '01122334466'
  });

  // Add employee to team
  team.memberIds.push(employee._id);
  await team.save();

  // Create team history
  await EmployeeTeamHistory.create({
    employeeId: employee._id,
    teamId: team._id,
    joinDate: new Date(),
    quarterId: 'Q2-2026'
  });

  // Create a mock sale with this employee inside sellers array
  await Sale.create({
    saleNumber: 'SALE-TDELETE-001',
    clientId: new mongoose.Types.ObjectId(),
    clientName: 'Test Client',
    projectName: 'Test Project',
    unitNumber: 'U-100',
    unitType: 'Appartment',
    unitValue: 1000000,
    contractDate: new Date(),
    source: 'Facebook',
    developerCollectionPercentage: 100,
    contractCommissionPercentage: 3,
    invoiceStatus: 'Not Issued',
    sellers: [
      { employeeId: employee._id, sharePercentage: 100 }
    ],
    quarterId: 'Q2-2026'
  });

  console.log(`Created test environment for employee: ${employee._id}`);

  // Try to delete employee
  try {
    const result = await deleteEmployee(employee._id);
    console.log('Delete service call succeeded:', result);

    // Verify cleanup
    const updatedTeam = await Team.findById(team._id);
    console.log('Team member count after deletion:', updatedTeam.memberIds.length);

    const historyCount = await EmployeeTeamHistory.countDocuments({ employeeId: employee._id });
    console.log('Team history records count after deletion:', historyCount);

    const salesCount = await Sale.countDocuments({ 'sellers.employeeId': employee._id });
    console.log('Sales count after deletion:', salesCount);

  } catch (err) {
    console.error('Delete service call failed:', err);
  }

  // Cleanup test resources (manager and team and sales)
  await Employee.findByIdAndDelete(manager._id);
  await Team.findByIdAndDelete(team._id);
  await Sale.deleteMany({ saleNumber: 'SALE-TDELETE-001' });

  await mongoose.disconnect();
}

run().catch(console.error);
