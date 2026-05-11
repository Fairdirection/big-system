const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');
const employeeService = require('../src/services/employee.service');
const teamService = require('../src/services/team.service');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // 1. Create a Sales Manager
    const manager = await Employee.create({
      code: 'MGR-TEST',
      name: 'Abdel Rahman Khaled Test',
      nationalId: '88888888888881',
      department: 'Sales',
      jobTitle: 'Sales Manager',
      seniorityLevel: 'SalesManager',
      email: 'abdelrahman.test@gmail.com',
      phone: '01234567812',
      isActive: true,
      hireDate: new Date(),
      managerId: new mongoose.Types.ObjectId()
    });

    // 2. Create a Team Leader
    const leader = await Employee.create({
      code: 'TL-TEST',
      name: 'Sherif Sabry Test',
      nationalId: '88888888888882',
      department: 'Sales',
      jobTitle: 'Team Leader',
      seniorityLevel: 'TeamLeader',
      email: 'sherif.test@gmail.com',
      phone: '01234567813',
      isActive: true,
      hireDate: new Date(),
      managerId: new mongoose.Types.ObjectId()
    });

    // 3. Create an active team led by the Team Leader
    const leaderTeam = await teamService.createTeam({
      teamLeaderId: leader._id,
      memberIds: []
    });

    console.log('\n--- Initial State ---');
    const leaderAfterTeamCreation = await Employee.findById(leader._id);
    console.log(`Leader Team ID: ${leaderTeam._id}`);
    console.log(`Leader currentTeamId: ${leaderAfterTeamCreation.currentTeamId}`);
    
    if (leaderAfterTeamCreation.currentTeamId.toString() !== leaderTeam._id.toString()) {
      throw new Error('Leader currentTeamId should point to their own team!');
    }

    // 4. Update the Sales Manager to manage the Team Leader's team
    await employeeService.updateEmployee(manager._id, {
      managedTeamIds: [leaderTeam._id]
    });

    console.log('\n--- After Manager Association ---');
    const leaderAfterAssociation = await Employee.findById(leader._id);
    console.log(`Leader currentTeamId: ${leaderAfterAssociation.currentTeamId}`);
    console.log(`Leader managerId: ${leaderAfterAssociation.managerId}`);

    if (leaderAfterAssociation.currentTeamId.toString() !== leaderTeam._id.toString()) {
      throw new Error('Leader currentTeamId should STILL point to their own team, not the manager team!');
    }
    if (leaderAfterAssociation.managerId.toString() !== manager._id.toString()) {
      throw new Error('Leader managerId should point to Abdel Rahman!');
    }

    // 5. Delete the Sales Manager's team
    const managerTeam = await Team.findOne({ teamLeaderId: manager._id, isActive: true });
    console.log(`Manager Team ID: ${managerTeam._id}`);

    await teamService.deleteTeam(managerTeam._id);

    console.log('\n--- After Manager Team Deletion ---');
    const leaderAfterDeletion = await Employee.findById(leader._id);
    console.log(`Leader currentTeamId: ${leaderAfterDeletion.currentTeamId}`);
    console.log(`Leader managerId: ${leaderAfterDeletion.managerId}`);

    if (leaderAfterDeletion.currentTeamId.toString() !== leaderTeam._id.toString()) {
      throw new Error('Leader currentTeamId was corrupted/cleared after manager team deletion!');
    }
    if (leaderAfterDeletion.managerId && leaderAfterDeletion.managerId.toString() === manager._id.toString()) {
      throw new Error('Leader managerId should have been reset from Abdel Rahman!');
    }

    // Clean up
    await Team.findByIdAndDelete(leaderTeam._id);
    await Team.findByIdAndDelete(managerTeam._id);
    await Employee.findByIdAndDelete(manager._id);
    await Employee.findByIdAndDelete(leader._id);
    await EmployeeTeamHistory.deleteMany({ employeeId: { $in: [manager._id, leader._id] } });

    console.log('\nSUCCESS: All assertions passed perfectly!');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

runTest();
