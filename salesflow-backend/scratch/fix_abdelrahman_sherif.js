const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');
const EmployeeTeamHistory = require('../src/models/employee-team-history.model');
const { getQuarterId } = require('../src/utils/quarter.utils');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const abdelrahman = await Employee.findOne({ name: /عبد الرحمن خالد/ });
  const sherif = await Employee.findOne({ name: /شريف صبرى/ });

  if (!abdelrahman || !sherif) {
    console.error('Could not find employees');
    await mongoose.disconnect();
    return;
  }

  const today = new Date();
  const quarterId = getQuarterId(today);

  // 1. Reactivate Abdel Rahman Khaled's team and add Sherif Sabry as member
  let salesManagerTeam = await Team.findOne({ teamLeaderId: abdelrahman._id });
  if (salesManagerTeam) {
    salesManagerTeam.isActive = true;
    salesManagerTeam.memberIds = [sherif._id];
    await salesManagerTeam.save();
    console.log('Reactivated Abdel Rahman team:', salesManagerTeam);
  } else {
    salesManagerTeam = await Team.create({
      name: abdelrahman.name,
      teamLeaderId: abdelrahman._id,
      memberIds: [sherif._id],
      isActive: true
    });
    console.log('Created new Abdel Rahman team:', salesManagerTeam);
  }

  // 2. Ensure Sherif Sabry is reporting to Abdel Rahman and in his team
  sherif.currentTeamId = salesManagerTeam._id;
  sherif.managerId = abdelrahman._id;
  sherif.teamJoinDate = today;
  await sherif.save();
  console.log('Updated Sherif Sabry profile:', sherif);

  // 3. Create/update history records for Sherif
  await EmployeeTeamHistory.findOneAndUpdate(
    { employeeId: sherif._id, teamId: salesManagerTeam._id, leaveDate: null },
    { joinDate: today, quarterId },
    { upsert: true, new: true }
  );
  console.log('Updated Team History for Sherif in Abdel Rahman team');

  // 4. Double check Sherif Sabry's own team
  const sherifTeam = await Team.findOne({ teamLeaderId: sherif._id });
  if (sherifTeam) {
    sherifTeam.isActive = true;
    await sherifTeam.save();
    console.log('Verified Sherif Sabry own team is active:', sherifTeam);
  }

  console.log('DB fix completed successfully!');
  await mongoose.disconnect();
}

run().catch(console.error);
