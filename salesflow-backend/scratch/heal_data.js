const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const ehab = await Employee.findOne({ name: /محمد ايهاب/i });
  const team = await Team.findOne({ name: /شريف/i });

  if (ehab && team) {
    console.log('Before update: Team memberIds:', team.memberIds);
    await Team.findByIdAndUpdate(team._id, { $pull: { memberIds: ehab._id } });
    console.log('Mohamed Ehab successfully removed from Sherif\'s team member list!');

    const updatedTeam = await Team.findById(team._id);
    console.log('After update: Team memberIds:', updatedTeam.memberIds);
  } else {
    console.log('Failed to find employee or team.');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
