const mongoose = require('mongoose');
require('dotenv').config();

async function checkEmps() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String, currentTeamId: mongoose.Schema.Types.ObjectId }));
  const emps = await Employee.find({ currentTeamId: { $ne: null } });
  console.log('Employees in Teams:', emps.map(e => ({ name: e.name, teamId: e.currentTeamId })));
  process.exit(0);
}
checkEmps();
