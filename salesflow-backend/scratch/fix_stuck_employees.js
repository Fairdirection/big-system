const mongoose = require('mongoose');
require('dotenv').config();

async function fixStuckEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({
      isActive: { type: Boolean, default: true }
    }));

    const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({
      currentTeamId: mongoose.Schema.Types.ObjectId
    }));

    const employees = await Employee.find({ currentTeamId: { $ne: null } });
    let count = 0;
    
    for (const emp of employees) {
      const team = await Team.findById(emp.currentTeamId);
      if (!team || !team.isActive) {
        console.log(`Employee ${emp._id} was stuck in deleted team ${emp.currentTeamId}. Clearing...`);
        await Employee.findByIdAndUpdate(emp._id, { $set: { currentTeamId: null } });
        count++;
      }
    }
    
    console.log(`Fixed ${count} employees.`);
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    process.exit(1);
  }
}

fixStuckEmployees();
