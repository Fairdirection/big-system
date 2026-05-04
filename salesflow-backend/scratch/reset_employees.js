require('dotenv').config();
const mongoose = require('mongoose');

async function resetEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // We don't need a full model definition if we use direct collection access or a simple model
    const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({ 
      currentTeamId: mongoose.Schema.Types.ObjectId 
    }));

    const result = await Employee.updateMany({}, { $set: { currentTeamId: null } });
    
    console.log(`Successfully reset ${result.modifiedCount} employees.`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting employees:', error);
    process.exit(1);
  }
}

resetEmployees();
