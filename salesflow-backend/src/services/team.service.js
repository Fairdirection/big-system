const Team = require('../models/team.model');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const { getQuarterId, calculateEmployeeQuarterDays } = require('../utils/quarter.utils');
const Sale = require('../models/sale.model');

const createTeam = async (data) => {
  const leader = await Employee.findById(data.teamLeaderId);
  if (!leader) throw new Error('Team leader not found');
  
  if (leader.currentTeamId) {
    throw new Error('This Team Leader is already assigned to another team');
  }

  // 1. Create the team
  const team = await Team.create({
    ...data,
    name: leader.name,
    memberIds: data.memberIds || [] // Only the members, not the leader
  });

  const today = new Date();
  const quarterId = getQuarterId(today);

  // 2. Handle Leader Status
  // Remove leader from any OLD team they were in
  if (leader.currentTeamId) {
    await Team.findByIdAndUpdate(leader.currentTeamId, { $pull: { memberIds: leader._id } });
  }
  await Employee.findByIdAndUpdate(leader._id, { currentTeamId: team._id, teamJoinDate: today });
  await EmployeeTeamHistory.findOneAndUpdate({ employeeId: leader._id, leaveDate: null }, { leaveDate: today });
  await EmployeeTeamHistory.create({ employeeId: leader._id, teamId: team._id, joinDate: today, quarterId });

  // 3. Handle Members Status
  if (data.memberIds && data.memberIds.length > 0) {
    for (const mId of data.memberIds) {
      const member = await Employee.findById(mId);
      if (member) {
        // Remove from OLD team if exists
        if (member.currentTeamId) {
          await Team.findByIdAndUpdate(member.currentTeamId, { $pull: { memberIds: mId } });
        }
        
        await Employee.findByIdAndUpdate(mId, { currentTeamId: team._id, teamJoinDate: today });
        await EmployeeTeamHistory.findOneAndUpdate({ employeeId: mId, leaveDate: null }, { leaveDate: today });
        await EmployeeTeamHistory.create({ employeeId: mId, teamId: team._id, joinDate: today, quarterId });
      }
    }
  }

  // Sync all targets for leaders in MongoDB so that static employee targets are updated instantly
  try {
    const employeeService = require('./employee.service');
    await employeeService.syncLeaderTargets(quarterId);
  } catch (err) {
    console.error('Error syncing leader targets on create:', err);
  }

  return team;
};

const getTeams = async () => {
  return await Team.find({ isActive: true }).populate('teamLeaderId', 'name code').populate('memberIds', 'name code');
};

const getTeamById = async (id) => {
  return await Team.findById(id).populate('teamLeaderId', 'name code').populate('memberIds', 'name code');
};

const updateTeam = async (id, data) => {
  const oldTeam = await Team.findById(id);
  if (!oldTeam) throw new Error('Team not found');

  const today = new Date();
  const quarterId = getQuarterId(today);

  // 1. Handle Leader Change
  if (data.teamLeaderId && data.teamLeaderId.toString() !== oldTeam.teamLeaderId.toString()) {
    const oldLeaderId = oldTeam.teamLeaderId.toString();
    const newLeaderId = data.teamLeaderId.toString();

    // Check if old leader is still in the team as a member
    const isStillMember = (data.memberIds || []).some(m => m.toString() === oldLeaderId);
    if (!isStillMember) {
      await Employee.findByIdAndUpdate(oldLeaderId, { currentTeamId: null, teamJoinDate: null });
      await EmployeeTeamHistory.findOneAndUpdate({ employeeId: oldLeaderId, teamId: id, leaveDate: null }, { leaveDate: today });
    }

    // Set new leader
    await Employee.findByIdAndUpdate(newLeaderId, { currentTeamId: id, teamJoinDate: today });
    await EmployeeTeamHistory.findOneAndUpdate({ employeeId: newLeaderId, leaveDate: null }, { leaveDate: today });
    await EmployeeTeamHistory.create({ employeeId: newLeaderId, teamId: id, joinDate: today, quarterId });
    
    const leader = await Employee.findById(newLeaderId);
    if (leader) data.name = leader.name;
  }

  // 2. Handle Members Change
  if (data.memberIds) {
    const oldMemberIds = oldTeam.memberIds.map(m => m.toString());
    const newMemberIds = data.memberIds.map(m => m.toString());

    // Removed Members
    const removedMembers = oldMemberIds.filter(m => !newMemberIds.includes(m));
    for (const mId of removedMembers) {
      // Don't clear if they are the NEW leader
      if (data.teamLeaderId && mId === data.teamLeaderId.toString()) continue;
      
      await Employee.findByIdAndUpdate(mId, { currentTeamId: null, teamJoinDate: null });
      await EmployeeTeamHistory.findOneAndUpdate({ employeeId: mId, teamId: id, leaveDate: null }, { leaveDate: today });
    }

    // Added Members
    const addedMembers = newMemberIds.filter(m => !oldMemberIds.includes(m));
    for (const mId of addedMembers) {
      // CRITICAL: Never add the leader to members list
      if (data.teamLeaderId && mId === data.teamLeaderId.toString()) continue;

      await Employee.findByIdAndUpdate(mId, { currentTeamId: id, teamJoinDate: today });
      await EmployeeTeamHistory.findOneAndUpdate({ employeeId: mId, leaveDate: null }, { leaveDate: today });
      await EmployeeTeamHistory.create({ employeeId: mId, teamId: id, joinDate: today, quarterId });
    }
  }

  // Sync all targets for leaders in MongoDB so that static employee targets are updated instantly
  try {
    const employeeService = require('./employee.service');
    await employeeService.syncLeaderTargets(quarterId);
  } catch (err) {
    console.error('Error syncing leader targets on update:', err);
  }

  return await Team.findByIdAndUpdate(id, data, { returnDocument: 'after' })
    .populate('teamLeaderId', 'name code')
    .populate('memberIds', 'name code');
};

const deleteTeam = async (id) => {
  const team = await Team.findById(id);
  if (!team) throw new Error('Team not found');

  const today = new Date();

  // 1. Find all employees who think they are in this team (Safety fallback)
  const stuckEmployees = await Employee.find({ currentTeamId: id });
  const stuckIds = stuckEmployees.map(e => e._id.toString());

  // 2. Combine with IDs from the team record
  const allStaff = [...(team.memberIds || []), team.teamLeaderId];
  const uniqueStaff = [...new Set([...allStaff.map(s => s?.toString()), ...stuckIds])].filter(Boolean);

  console.log(`Deleting team ${id}. Releasing ${uniqueStaff.length} staff members.`);

  for (const staffId of uniqueStaff) {
    // Clear employee status
    await Employee.findByIdAndUpdate(staffId, {
      $set: { 
        currentTeamId: null,
        teamJoinDate: null 
      }
    });

    // Close their history for this team
    await EmployeeTeamHistory.findOneAndUpdate(
      { employeeId: staffId, teamId: id, leaveDate: null },
      { $set: { leaveDate: today } }
    );
  }

  // 3. Deactivate the team and clear its internal lists
  const resultTeam = await Team.findByIdAndUpdate(id, { 
    $set: { 
      isActive: false,
      memberIds: [] // Clear members list in the team object too
    } 
  }, { returnDocument: 'after' });

  // Sync all targets for leaders in MongoDB so that static employee targets are updated instantly
  try {
    const quarterId = getQuarterId(today);
    const employeeService = require('./employee.service');
    await employeeService.syncLeaderTargets(quarterId);
  } catch (err) {
    console.error('Error syncing leader targets on delete:', err);
  }

  return resultTeam;
};

const getTeamTargetSummary = async (teamId, quarterId) => {
  const team = await Team.findById(teamId).populate('memberIds').populate('teamLeaderId').lean();
  if (!team) throw new Error('Team not found');

  const employeeService = require('./employee.service');

  const membersProgress = [];
  let totalAdjustedTarget = 0;
  let totalAchieved = 0;

  // 1. Process team members
  for (const member of (team.memberIds || [])) {
    if (!member) continue;
    const memberProg = await employeeService.getTargetProgress(member._id.toString(), quarterId);
    
    totalAdjustedTarget += memberProg.adjustedTarget || 0;
    totalAchieved += memberProg.achievedSalesValue || 0;

    membersProgress.push({
      employeeId: member._id,
      name: member.name,
      code: member.code,
      adjustedTarget: Math.round(memberProg.adjustedTarget),
      achieved: Math.round(memberProg.achievedSalesValue),
      achievementPercentage: memberProg.achievementPercentage,
      sales: memberProg.sales || []
    });
  }

  // 2. Process team leader (personal progress only)
  if (team.teamLeaderId) {
    const leaderProg = await employeeService.getPersonalTargetProgressOnly(team.teamLeaderId, quarterId);

    // Since they lead a team, their personal target is 0. Only their personal sales achievements count.
    leaderProg.adjustedTarget = 0;
    leaderProg.fullTarget = 0;

    totalAdjustedTarget += leaderProg.adjustedTarget || 0;
    totalAchieved += leaderProg.achievedSalesValue || 0;

    membersProgress.push({
      employeeId: team.teamLeaderId._id,
      name: team.teamLeaderId.name + ' (قائد)',
      code: team.teamLeaderId.code,
      adjustedTarget: Math.round(leaderProg.adjustedTarget),
      achieved: Math.round(leaderProg.achievedSalesValue),
      achievementPercentage: leaderProg.achievementPercentage,
      sales: leaderProg.sales || []
    });
  }

  return {
    teamId,
    teamName: team.name,
    quarterId,
    membersProgress,
    totalAdjustedTarget: Math.round(totalAdjustedTarget),
    totalAchieved: Math.round(totalAchieved),
    overallAchievementPercentage: totalAdjustedTarget > 0 ? Math.round((totalAchieved / totalAdjustedTarget) * 1000) / 10 : 0
  };
};

const getTeamsWithPerformance = async (quarterId) => {
  const teams = await Team.find({ isActive: true })
    .populate('teamLeaderId')
    .populate('memberIds')
    .lean();
  
  const employeeService = require('./employee.service');

  const results = [];

  for (const team of teams) {
    let totalAdjustedTarget = 0;
    let totalAchieved = 0;
    const membersPerformance = [];

    // Process team members
    for (const member of (team.memberIds || [])) {
      if (!member) continue;
      const memberProg = await employeeService.getTargetProgress(member._id.toString(), quarterId);
      
      totalAdjustedTarget += memberProg.adjustedTarget || 0;
      totalAchieved += memberProg.achievedSalesValue || 0;

      membersPerformance.push({
        employeeId: member._id,
        name: member.name,
        code: member.code,
        adjustedTarget: Math.round(memberProg.adjustedTarget),
        achieved: Math.round(memberProg.achievedSalesValue),
        achievementPercentage: memberProg.achievementPercentage
      });
    }

    // Process team leader (personal progress only)
    if (team.teamLeaderId) {
      const leaderProg = await employeeService.getPersonalTargetProgressOnly(team.teamLeaderId, quarterId);

      // Since they lead a team, their personal target is 0. Only their personal sales achievements count.
      leaderProg.adjustedTarget = 0;
      leaderProg.fullTarget = 0;

      totalAdjustedTarget += leaderProg.adjustedTarget || 0;
      totalAchieved += leaderProg.achievedSalesValue || 0;

      membersPerformance.push({
        employeeId: team.teamLeaderId._id,
        name: team.teamLeaderId.name + ' (قائد)',
        code: team.teamLeaderId.code,
        adjustedTarget: Math.round(leaderProg.adjustedTarget),
        achieved: Math.round(leaderProg.achievedSalesValue),
        achievementPercentage: leaderProg.achievementPercentage
      });
    }

    results.push({
      ...team,
      performance: {
        totalAdjustedTarget: Math.round(totalAdjustedTarget),
        totalAchieved: Math.round(totalAchieved),
        overallAchievementPercentage: totalAdjustedTarget > 0 ? Math.round((totalAchieved / totalAdjustedTarget) * 1000) / 10 : 0,
        membersPerformance
      }
    });
  }

  return results;
};

const reassignMembers = async (oldTeamId, { membersReassignment }) => {
  const today = new Date();
  const quarterId = getQuarterId(today);

  for (const task of membersReassignment) {
    const { employeeId, newTeamId } = task;

    // 1. Close old history
    await EmployeeTeamHistory.findOneAndUpdate(
      { employeeId, teamId: oldTeamId, leaveDate: null },
      { leaveDate: today }
    );

    // 2. Open new history
    await EmployeeTeamHistory.create({
      employeeId,
      teamId: newTeamId,
      joinDate: today,
      quarterId
    });

    // 3. Update employee
    await Employee.findByIdAndUpdate(employeeId, {
      currentTeamId: newTeamId,
      teamJoinDate: today
    });

    // 4. Update teams
    await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: employeeId } });
    await Team.findByIdAndUpdate(newTeamId, { $addToSet: { memberIds: employeeId } });
  }

  // Soft delete old team
  await Team.findByIdAndUpdate(oldTeamId, { isActive: false });

  return { success: true, message: 'Members reassigned and old team deactivated' };
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamTargetSummary,
  getTeamsWithPerformance,
  reassignMembers
};
