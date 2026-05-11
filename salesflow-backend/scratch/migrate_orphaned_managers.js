const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../src/models/employee.model');
const Team = require('../src/models/team.model');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const topManager = await Employee.findOne({ department: 'TopManagement', isActive: true });
    const defaultManagerId = topManager ? topManager._id : '69f60230c2120b7ce02988dd';

    const employees = await Employee.find({ isActive: true });
    let updatedCount = 0;

    for (const emp of employees) {
      if (emp.managerId) {
        const manager = await Employee.findById(emp.managerId);
        
        if (!manager || !manager.isActive) {
          emp.managerId = defaultManagerId;
          await emp.save();
          updatedCount++;
          console.log(`Reset manager of ${emp.name} to default because manager is inactive/non-existent.`);
        } else {
          // If manager is a Sales Manager, they must have an active team to manage others
          if (manager.seniorityLevel === 'SalesManager' || manager.jobTitle === 'Sales Manager') {
            const managerActiveTeam = await Team.findOne({ teamLeaderId: manager._id, isActive: true });
            if (!managerActiveTeam) {
              emp.managerId = defaultManagerId;
              await emp.save();
              updatedCount++;
              console.log(`Reset manager of ${emp.name} to default because Sales Manager ${manager.name} has no active team.`);
            }
          }
        }
      }
    }

    console.log(`\nMigration completed successfully. Updated ${updatedCount} employees.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

run();
