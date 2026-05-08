const mongoose = require('mongoose');
const Team = require('../models/team.model');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const { getQuarterId, getQuarterBounds, calculateWorkingDays, calculateEmployeeQuarterDays } = require('../utils/quarter.utils');
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

  const oldLeaderId = oldTeam.teamLeaderId ? oldTeam.teamLeaderId.toString() : null;
  const newLeaderId = data.teamLeaderId ? data.teamLeaderId.toString() : null;

  // 1. Handle Leader Change
  if (newLeaderId && newLeaderId !== oldLeaderId) {
    if (oldLeaderId) {
      // Check if old leader is still in the team as a member
      const isStillMember = (data.memberIds || []).some(m => m && m.toString() === oldLeaderId);
      if (!isStillMember) {
        const oldLeader = await Employee.findById(oldLeaderId);
        if (oldLeader && oldLeader.currentTeamId && oldLeader.currentTeamId.toString() === id.toString()) {
          await Employee.findByIdAndUpdate(oldLeaderId, { currentTeamId: null, teamJoinDate: null });
        }
        await EmployeeTeamHistory.findOneAndUpdate({ employeeId: oldLeaderId, teamId: id, leaveDate: null }, { leaveDate: today });
      }
    }

    // Set new leader
    const newLeader = await Employee.findById(newLeaderId);
    if (newLeader) {
      // If the new leader is currently in another team, pull them out of that team's document!
      if (newLeader.currentTeamId && newLeader.currentTeamId.toString() !== id.toString()) {
        await Team.findByIdAndUpdate(newLeader.currentTeamId, { $pull: { memberIds: newLeaderId } });
        await EmployeeTeamHistory.findOneAndUpdate(
          { employeeId: newLeaderId, teamId: newLeader.currentTeamId, leaveDate: null },
          { leaveDate: today }
        );
      }

      await Employee.findByIdAndUpdate(newLeaderId, { currentTeamId: id, teamJoinDate: today });
      await EmployeeTeamHistory.findOneAndUpdate({ employeeId: newLeaderId, leaveDate: null }, { leaveDate: today });
      await EmployeeTeamHistory.create({ employeeId: newLeaderId, teamId: id, joinDate: today, quarterId });
      
      data.name = newLeader.name;
    }
  }

  // 2. Handle Members Change
  if (data.memberIds) {
    // CRITICAL: Ensure the active team leader is NEVER in the member list
    const activeLeaderId = newLeaderId || oldLeaderId;
    if (activeLeaderId) {
      data.memberIds = data.memberIds.filter(m => m && m.toString() !== activeLeaderId);
    }

    const oldMemberIds = (oldTeam.memberIds || []).filter(Boolean).map(m => m.toString());
    const newMemberIds = data.memberIds.filter(Boolean).map(m => m.toString());

    // Removed Members
    const removedMembers = oldMemberIds.filter(m => !newMemberIds.includes(m));
    for (const mId of removedMembers) {
      // Don't clear if they are the NEW leader
      if (activeLeaderId && mId === activeLeaderId) continue;
      
      const member = await Employee.findById(mId);
      if (member) {
        // Only clear if their currentTeamId is still this team
        if (member.currentTeamId && member.currentTeamId.toString() === id.toString()) {
          await Employee.findByIdAndUpdate(mId, { currentTeamId: null, teamJoinDate: null });
        }
        await EmployeeTeamHistory.findOneAndUpdate({ employeeId: mId, teamId: id, leaveDate: null }, { leaveDate: today });
      }
    }

    // Added Members
    const addedMembers = newMemberIds.filter(m => !oldMemberIds.includes(m));
    for (const mId of addedMembers) {
      // CRITICAL: Never add the leader to members list
      if (activeLeaderId && mId === activeLeaderId) continue;

      const member = await Employee.findById(mId);
      if (member) {
        // If they were already in another team, pull them out of that team's document!
        if (member.currentTeamId && member.currentTeamId.toString() !== id.toString()) {
          await Team.findByIdAndUpdate(member.currentTeamId, { $pull: { memberIds: mId } });
          await EmployeeTeamHistory.findOneAndUpdate(
            { employeeId: mId, teamId: member.currentTeamId, leaveDate: null },
            { leaveDate: today }
          );
        }

        await Employee.findByIdAndUpdate(mId, { currentTeamId: id, teamJoinDate: today });
        await EmployeeTeamHistory.findOneAndUpdate({ employeeId: mId, leaveDate: null }, { leaveDate: today });
        await EmployeeTeamHistory.create({ employeeId: mId, teamId: id, joinDate: today, quarterId });
      }
    }
  }

  return await Team.findByIdAndUpdate(id, data, { new: true })
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
  }, { new: true });
};

const getTeamMemberPerformance = async (employeeId, teamId, quarterId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;

  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);

  // Find all history records for this employee, in this team, during this quarter
  const histories = await EmployeeTeamHistory.find({
    employeeId,
    teamId,
    quarterId
  }).lean();

  let teamWorkingDays = 0;
  const intervals = [];

  if (histories.length > 0) {
    for (const h of histories) {
      const joinDateObj = new Date(h.joinDate);
      joinDateObj.setHours(0, 0, 0, 0); // Normalize to start of day
      const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

      const leaveDate = h.leaveDate ? new Date(h.leaveDate) : (employee.isActive ? qEnd : (employee.endDate || new Date()));
      const leaveDateObj = new Date(leaveDate);
      leaveDateObj.setHours(23, 59, 59, 999); // Normalize to end of day
      const effEnd = new Date(Math.min(qEnd.getTime(), leaveDateObj.getTime()));

      if (effEnd >= effStart) {
        const days = calculateWorkingDays(effStart, effEnd);
        teamWorkingDays += days;
        intervals.push({ start: effStart, end: effEnd });
      }
    }
  } else if (employee.currentTeamId && employee.currentTeamId.toString() === teamId.toString()) {
    const joinDateObj = new Date(employee.teamJoinDate || employee.createdAt);
    joinDateObj.setHours(0, 0, 0, 0); // Normalize to start of day
    const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

    const endDate = employee.isActive ? qEnd : (employee.endDate || new Date());
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Normalize to end of day
    const effEnd = new Date(Math.min(qEnd.getTime(), endDateObj.getTime()));

    if (effEnd >= effStart) {
      const days = calculateWorkingDays(effStart, effEnd);
      teamWorkingDays += days;
      intervals.push({ start: effStart, end: effEnd });
    }
  } else {
    return null;
  }

  const employeeService = require('./employee.service');
  const memberProgress = await employeeService.getTargetProgress(employeeId, quarterId);

  let adjustedTarget;
  let achievedSalesValue = 0;
  let achievedCommission = 0;
  let salesList = [];
  let clientsCount = 0;

  if (memberProgress.isTeamLeader && memberProgress.teamMembersCount > 0) {
    adjustedTarget = memberProgress.adjustedTarget;
    achievedSalesValue = memberProgress.achievedSalesValue || memberProgress.achievedSales || 0;
    achievedCommission = memberProgress.achievedCommission || 0;
    salesList = memberProgress.sales || [];
    clientsCount = memberProgress.clientsCount || 0;
  } else {
    adjustedTarget = (employee.target / 90) * teamWorkingDays;

    // Now, fetch only the sales achieved by this seller during their tenure in this team!
    const salesQuery = {
      status: { $in: ['confirmed', 'claimed', 'collected'] },
      isActive: true,
      $and: [
        {
          $or: [
            { 'sellers.employeeId': employeeId },
            { 'sellers.employeeId': new mongoose.Types.ObjectId(employeeId) }
          ]
        }
      ]
    };

    if (intervals.length > 0) {
      salesQuery.$and.push({
        $or: intervals.map(interval => ({
          contractDate: { $gte: interval.start, $lte: interval.end }
        }))
      });
    } else {
      return null;
    }

    const sales = await Sale.find(salesQuery).populate('clientId').lean();

    const uniqueClients = new Set();

    sales.forEach(sale => {
      const seller = sale.sellers.find(s => {
        const sId = s.employeeId?._id ? s.employeeId._id.toString() : s.employeeId?.toString();
        return sId === employeeId.toString();
      });
      if (seller) {
        achievedSalesValue += (sale.unitValue || 0);
        achievedCommission += (seller.commissionValue || 0);
        if (sale.clientId) uniqueClients.add(sale.clientId.toString());
      }
    });

    salesList = sales.map(s => ({
      _id: s._id,
      projectName: s.projectName,
      unitNumber: s.unitNumber,
      unitValue: s.unitValue,
      contractDate: s.contractDate,
      clientName: s.clientName,
      status: s.status
    }));
    clientsCount = uniqueClients.size;
  }

  const achievementPercentage = adjustedTarget > 0 ? (achievedSalesValue / adjustedTarget) * 100 : 0;

  return {
    employeeId: employee._id,
    name: employee.name,
    code: employee.code,
    fullTarget: employee.target,
    actualWorkingDays: teamWorkingDays,
    adjustedTarget: Math.round(adjustedTarget),
    achieved: Math.round(achievedSalesValue),
    achievedSalesValue: Math.round(achievedSalesValue),
    achievedCommission: Math.round(achievedCommission),
    clientsCount: clientsCount,
    achievementPercentage: Math.round(achievementPercentage * 10) / 10,
    sales: salesList
  };
};

const getTeamTargetSummary = async (teamId, quarterId) => {
  const team = await Team.findById(teamId).populate('memberIds').populate('teamLeaderId').lean();
  if (!team) throw new Error('Team not found');

  const employeeService = require('./employee.service');

  const membersProgress = [];
  let totalAdjustedTarget = 0;
  let totalAchieved = 0;

  // 1. Find all members who have team history in this team during this quarter
  const histories = await EmployeeTeamHistory.find({ teamId: team._id, quarterId });
  
  // Get unique member IDs from histories and merge with current memberIds
  const historyMemberIds = histories.map(h => h.employeeId.toString());
  const currentMemberIds = (team.memberIds || []).map(m => m._id ? m._id.toString() : m.toString());
  const uniqueMemberIds = [...new Set([...historyMemberIds, ...currentMemberIds])];

  for (const memberId of uniqueMemberIds) {
    if (!mongoose.isValidObjectId(memberId)) continue;
    
    // Check if member is the team leader (we process them separately)
    if (team.teamLeaderId && team.teamLeaderId._id.toString() === memberId) continue;

    // Use our precise team-specific performance helper!
    const memberPerf = await getTeamMemberPerformance(memberId, team._id, quarterId);
    if (!memberPerf) continue;

    totalAdjustedTarget += memberPerf.adjustedTarget || 0;
    totalAchieved += memberPerf.achievedSalesValue || 0;

    membersProgress.push({
      employeeId: memberPerf.employeeId,
      name: memberPerf.name,
      code: memberPerf.code,
      fullTarget: memberPerf.fullTarget,
      actualWorkingDays: memberPerf.actualWorkingDays,
      adjustedTarget: memberPerf.adjustedTarget,
      achieved: memberPerf.achieved,
      achievementPercentage: memberPerf.achievementPercentage,
      sales: memberPerf.sales || []
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
      fullTarget: 0,
      actualWorkingDays: 90,
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

    // 1. Find all members who have team history in this team during this quarter
    const histories = await EmployeeTeamHistory.find({ teamId: team._id, quarterId });
    
    // Get unique member IDs from histories and merge with current memberIds
    const historyMemberIds = histories.map(h => h.employeeId.toString());
    const currentMemberIds = (team.memberIds || []).map(m => m._id ? m._id.toString() : m.toString());
    const uniqueMemberIds = [...new Set([...historyMemberIds, ...currentMemberIds])];

    for (const memberId of uniqueMemberIds) {
      if (!mongoose.isValidObjectId(memberId)) continue;
      
      // Skip the team leader (processed separately below)
      if (team.teamLeaderId && team.teamLeaderId._id.toString() === memberId) continue;

      const memberPerf = await getTeamMemberPerformance(memberId, team._id, quarterId);
      if (!memberPerf) continue;

      totalAdjustedTarget += memberPerf.adjustedTarget || 0;
      totalAchieved += memberPerf.achievedSalesValue || 0;

      membersPerformance.push({
        employeeId: memberPerf.employeeId,
        name: memberPerf.name,
        code: memberPerf.code,
        adjustedTarget: memberPerf.adjustedTarget,
        achieved: memberPerf.achieved,
        achievementPercentage: memberPerf.achievementPercentage
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
