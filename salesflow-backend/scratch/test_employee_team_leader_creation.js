const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const employeeService = require('../src/services/employee.service');
const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find some active sellers without teams to use as members
    const unassignedSellers = await Employee.find({
      department: 'Sales',
      seniorityLevel: { $in: ['Fresh', 'BA', 'BC', 'Senior', 'SV'] },
      isActive: true,
      $or: [{ currentTeamId: null }, { currentTeamId: { $exists: false } }]
    }).limit(2);

    console.log('Found unassigned sellers:', unassignedSellers.map(s => `${s.name} (${s._id})`));

    const memberIds = unassignedSellers.map(s => s._id.toString());

    // Create a new Team Leader under Abdel Rahman Khaled's management
    // Abdel Rahman is EMP-0002
    const manager = await Employee.findOne({ code: 'EMP-0002' });
    if (!manager) {
      console.log('Abdel Rahman Khaled not found!');
      return;
    }

    console.log(`Creating Team Leader under manager: ${manager.name} (${manager._id})`);

    const newLeader = await employeeService.createEmployee({
      name: 'Test Team Leader ' + Date.now(),
      nationalId: '12345678901234',
      department: 'Sales',
      seniorityLevel: 'TeamLeader',
      hireDate: new Date(),
      email: 'test_tl_' + Date.now() + '@salesflow.com',
      phone: '01234567890',
      managerId: manager._id.toString(),
      teamMemberIds: memberIds
    });

    console.log('Created Team Leader successfully:', newLeader.name, 'with ID:', newLeader._id);

    // Verify team was created
    const team = await Team.findOne({ teamLeaderId: newLeader._id, isActive: true });
    if (team) {
      console.log('Team created successfully:', team.name);
      console.log('Team members IDs:', team.memberIds.map(id => id.toString()));
      console.log('Expected member IDs:', memberIds);
    } else {
      console.log('Error: Team was not created for the new Team Leader!');
    }

    // Cleanup test data
    if (team) {
      await Team.deleteOne({ _id: team._id });
    }
    await Employee.deleteOne({ _id: newLeader._id });
    for (const mId of memberIds) {
      await Employee.updateOne({ _id: mId }, { $set: { currentTeamId: null, managerId: manager._id } });
    }

    console.log('Cleanup completed cleanly.');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

test();
