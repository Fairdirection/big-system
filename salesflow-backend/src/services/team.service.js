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
  return await Team.findByIdAndUpdate(id, { 
    $set: { 
      isActive: false,
      memberIds: [] // Clear members list in the team object too
    } 
  }, { returnDocument: 'after' });
};

const getTeamTargetSummary = async (teamId, quarterId) => {
  const team = await Team.findById(teamId).populate('memberIds').populate('teamLeaderId').lean();
  if (!team) throw new Error('Team not found');

  const { start, end } = require('../utils/quarter.utils').getQuarterBounds(quarterId);
  
  // Bulk fetch sales and history for all members
  const allStaff = [...team.memberIds, team.teamLeaderId].filter(Boolean);
  const allStaffIds = allStaff.map(m => m._id);

  const [allHistory, allSales] = await Promise.all([
    EmployeeTeamHistory.find({ employeeId: { $in: allStaffIds } }).lean(),
    Sale.find({
      isActive: true,
      status: { $in: ['confirmed', 'claimed', 'collected'] },
      'sellers.employeeId': { $in: allStaffIds },
      $or: [
        { quarterId },
        { contractDate: { $gte: start, $lte: end } }
      ]
    }).lean()
  ]);

  const historyMap = allHistory.reduce((acc, h) => {
    const eid = h.employeeId.toString();
    if (!acc[eid]) acc[eid] = [];
    acc[eid].push(h);
    return acc;
  }, {});

  const membersProgress = [];
  let totalAdjustedTarget = 0;
  let totalAchieved = 0;

  for (const member of allStaff) {
    const history = historyMap[member._id.toString()] || [];
    const workingDays = calculateEmployeeQuarterDays(history, quarterId);
    const adjustedTarget = (member.target / 90) * workingDays;

    const memberSales = allSales.filter(sale => 
      sale.sellers.some(s => s.employeeId.toString() === member._id.toString())
    );

    let achieved = 0;
    memberSales.forEach(sale => achieved += (sale.unitValue || 0));

    totalAdjustedTarget += adjustedTarget;
    totalAchieved += achieved;

    membersProgress.push({
      employeeId: member._id,
      name: member.name + (member._id.toString() === team.teamLeaderId._id.toString() ? ' (قائد)' : ''),
      code: member.code,
      adjustedTarget: Math.round(adjustedTarget * 100) / 100,
      achieved: Math.round(achieved * 100) / 100,
      achievementPercentage: adjustedTarget > 0 ? Math.round((achieved / adjustedTarget) * 1000) / 10 : 0,
      sales: memberSales.map(s => ({
        _id: s._id,
        projectName: s.projectName,
        unitNumber: s.unitNumber,
        unitValue: s.unitValue,
        contractDate: s.contractDate,
        clientName: s.clientName,
        status: s.status
      }))
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
    .populate('teamLeaderId', 'name code target')
    .populate('memberIds', 'name code target')
    .lean();
  
  const { start, end } = require('../utils/quarter.utils').getQuarterBounds(quarterId);
  
  // 1. Fetch all sales for this quarter
  const sales = await Sale.find({
    isActive: true,
    status: { $in: ['confirmed', 'claimed', 'collected'] },
    $or: [
      { quarterId: quarterId },
      { contractDate: { $gte: start, $lte: end } }
    ]
  }).lean();

  // 2. Fetch all history for all members
  const allRelevantStaffIds = teams.flatMap(t => [
    ...(t.memberIds || []).map(m => m._id),
    t.teamLeaderId._id
  ]).filter(Boolean);

  const allHistory = await EmployeeTeamHistory.find({ 
    employeeId: { $in: allRelevantStaffIds } 
  }).lean();

  const historyMap = allHistory.reduce((acc, h) => {
    const eid = h.employeeId.toString();
    if (!acc[eid]) acc[eid] = [];
    acc[eid].push(h);
    return acc;
  }, {});

  // 3. Process in memory
  return teams.map(team => {
    let totalAdjustedTarget = 0;
    let totalAchieved = 0;
    const membersPerformance = [];

    const allStaff = [...(team.memberIds || []), team.teamLeaderId].filter(Boolean);

    allStaff.forEach(member => {
      const memHistory = historyMap[member._id.toString()] || [];
      const workingDays = calculateEmployeeQuarterDays(memHistory, quarterId);
      const adjustedTarget = (member.target / 90) * workingDays;
      totalAdjustedTarget += adjustedTarget;

      // Find sales for this member
      let memberAchieved = 0;
      sales.forEach(sale => {
        const seller = (sale.sellers || []).find(s => s.employeeId.toString() === member._id.toString());
        if (seller) memberAchieved += (sale.unitValue || 0);
      });
      totalAchieved += memberAchieved;

      membersPerformance.push({
        employeeId: member._id,
        name: member.name,
        code: member.code,
        adjustedTarget: Math.round(adjustedTarget),
        achieved: Math.round(memberAchieved),
        achievementPercentage: adjustedTarget > 0 ? Math.round((memberAchieved / adjustedTarget) * 1000) / 10 : 0
      });
    });

    return {
      ...team,
      performance: {
        totalAdjustedTarget: Math.round(totalAdjustedTarget),
        totalAchieved: Math.round(totalAchieved),
        overallAchievementPercentage: totalAdjustedTarget > 0 ? Math.round((totalAchieved / totalAdjustedTarget) * 1000) / 10 : 0,
        membersPerformance
      }
    };
  });
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
