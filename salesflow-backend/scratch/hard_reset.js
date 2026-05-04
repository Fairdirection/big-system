const mongoose = require('mongoose');
require('dotenv').config();

async function hardReset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Starting Hard Reset of Teams and Assignments...');

    const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({
      isActive: Boolean,
      memberIds: [mongoose.Schema.Types.ObjectId]
    }));

    const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({
      currentTeamId: mongoose.Schema.Types.ObjectId,
      teamJoinDate: Date
    }));

    // 1. Deactivate and clear all teams
    const teamRes = await Team.updateMany({}, { 
      $set: { 
        isActive: false,
        memberIds: []
      } 
    });
    console.log(`Deactivated ${teamRes.modifiedCount} teams.`);

    // 2. Clear all employee assignments
    const empRes = await Employee.updateMany({}, { 
      $set: { 
        currentTeamId: null,
        teamJoinDate: null
      } 
    });
    console.log(`Unassigned ${empRes.modifiedCount} employees.`);

    console.log('Hard Reset Complete. You can now start fresh.');
    process.exit(0);
  } catch (error) {
    console.error('Hard Reset error:', error);
    process.exit(1);
  }
}

hardReset();
