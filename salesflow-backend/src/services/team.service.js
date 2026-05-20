const mongoose = require('mongoose');
const Team = require('../models/team.model');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const QuarterlyTarget = require('../models/quarterly-target.model');
const { getQuarterId, getQuarterBounds, calculateWorkingDays, calculateEmployeeQuarterDays } = require('../utils/quarter.utils');
const Sale = require('../models/sale.model');
require('../models/client.model');

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
  return await Team.find({ isActive: true })
    .populate({
      path: 'teamLeaderId',
      select: 'name code seniorityLevel managerId',
      populate: {
        path: 'managerId',
        select: 'name code'
      }
    })
    .populate('memberIds', 'name code seniorityLevel');
};

const getTeamById = async (id) => {
  return await Team.findById(id)
    .populate({
      path: 'teamLeaderId',
      select: 'name code seniorityLevel managerId',
      populate: {
        path: 'managerId',
        select: 'name code'
      }
    })
    .populate('memberIds', 'name code seniorityLevel');
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

  // Find default manager to reassign released employees
  const topManager = await Employee.findOne({ department: 'TopManagement', isActive: true });
  const defaultManagerId = topManager ? topManager._id : null;

  // 1. Find all employees who think they are in this team (Safety fallback)
  const stuckEmployees = await Employee.find({ currentTeamId: id });
  const stuckIds = stuckEmployees.map(e => e._id.toString());

  // 2. Combine with IDs from the team record
  const allStaff = [...(team.memberIds || []), team.teamLeaderId];
  const uniqueStaff = [...new Set([...allStaff.map(s => s?.toString()), ...stuckIds])].filter(Boolean);

  console.log(`Deleting team ${id}. Releasing ${uniqueStaff.length} staff members.`);

  for (const staffId of uniqueStaff) {
    const emp = await Employee.findById(staffId);
    if (emp) {
      const updates = {};

      // If they are currently assigned to this specific team, reassign currentTeamId
      if (emp.currentTeamId && emp.currentTeamId.toString() === id.toString()) {
        // Check if they are a Team Leader of another active team
        const ledTeam = await Team.findOne({ teamLeaderId: staffId, isActive: true, _id: { $ne: id } });
        
        updates.currentTeamId = ledTeam ? ledTeam._id : null;
        updates.teamJoinDate = ledTeam ? ledTeam.createdAt : null;
      }

      // If their manager is the teamLeader of the deleted team, reset their managerId
      if (emp.managerId && team.teamLeaderId && emp.managerId.toString() === team.teamLeaderId.toString()) {
        updates.managerId = defaultManagerId;
      }

      if (Object.keys(updates).length > 0) {
        await Employee.findByIdAndUpdate(staffId, { $set: updates });
      }
    }

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
    joinDate: { $lte: qEnd },
    $or: [
      { leaveDate: null },
      { leaveDate: { $gte: qStart } }
    ]
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

  const customTargetRecord = await QuarterlyTarget.findOne({
    employeeId: employee._id,
    quarterId
  });
  const baseQuarterlyTarget = customTargetRecord ? customTargetRecord.target : employee.target;

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
    adjustedTarget = (baseQuarterlyTarget / 90) * teamWorkingDays;

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
    fullTarget: baseQuarterlyTarget,
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

  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);

  // 1. Find all members who have team history in this team during this quarter
  const histories = await EmployeeTeamHistory.find({
    teamId: team._id,
    joinDate: { $lte: qEnd },
    $or: [
      { leaveDate: null },
      { leaveDate: { $gte: qStart } }
    ]
  });
  
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
      name: team.teamLeaderId.name + ' (Leader)',
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
  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);

  const [teams, allHistories, allQuarterlyTargets, allSales, allEmployees] = await Promise.all([
    Team.find({ isActive: true })
      .populate({
        path: 'teamLeaderId',
        populate: {
          path: 'managerId',
          select: 'name code'
        }
      })
      .populate('memberIds')
      .lean(),
    EmployeeTeamHistory.find({
      joinDate: { $lte: qEnd },
      $or: [
        { leaveDate: null },
        { leaveDate: { $gte: qStart } }
      ]
    }).lean(),
    QuarterlyTarget.find({ quarterId }).lean(),
    Sale.find({
      status: { $in: ['confirmed', 'claimed', 'collected'] },
      isActive: true
    }).lean(),
    Employee.find({ department: 'Sales' }).lean()
  ]);

  const empMap = new Map(allEmployees.map(e => [e._id.toString(), e]));
  const targetMap = new Map(allQuarterlyTargets.map(t => [t.employeeId.toString(), t.target]));

  const historyByEmp = new Map();
  for (const h of allHistories) {
    const empId = h.employeeId.toString();
    if (!historyByEmp.has(empId)) historyByEmp.set(empId, []);
    historyByEmp.get(empId).push(h);
  }

  const salesByEmp = new Map();
  for (const s of allSales) {
    const contractDate = new Date(s.contractDate);
    if (contractDate >= qStart && contractDate <= qEnd) {
      for (const seller of (s.sellers || [])) {
        const selId = seller.employeeId?._id ? seller.employeeId._id.toString() : seller.employeeId?.toString();
        if (selId) {
          if (!salesByEmp.has(selId)) salesByEmp.set(selId, []);
          salesByEmp.get(selId).push({ sale: s, seller });
        }
      }
    }
  }

  const getMemberTeamPerf = (empIdStr, teamIdStr) => {
    const emp = empMap.get(empIdStr);
    if (!emp) return null;

    const baseQuarterlyTarget = targetMap.get(empIdStr) ?? emp.target ?? 0;
    const histories = historyByEmp.get(empIdStr) || [];

    let teamWorkingDays = 0;
    const intervals = [];

    const teamHistories = histories.filter(h => h.teamId && h.teamId.toString() === teamIdStr);

    if (teamHistories.length > 0) {
      for (const h of teamHistories) {
        const joinDateObj = new Date(h.joinDate);
        joinDateObj.setHours(0, 0, 0, 0);
        const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

        const leaveDate = h.leaveDate ? new Date(h.leaveDate) : (emp.isActive ? qEnd : (emp.endDate || new Date()));
        const leaveDateObj = new Date(leaveDate);
        leaveDateObj.setHours(23, 59, 59, 999);
        const effEnd = new Date(Math.min(qEnd.getTime(), leaveDateObj.getTime()));

        if (effEnd >= effStart) {
          const days = calculateWorkingDays(effStart, effEnd);
          teamWorkingDays += days;
          intervals.push({ start: effStart, end: effEnd });
        }
      }
    } else if (emp.currentTeamId && emp.currentTeamId.toString() === teamIdStr) {
      const joinDateObj = new Date(emp.teamJoinDate || emp.createdAt);
      joinDateObj.setHours(0, 0, 0, 0);
      const effStart = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

      const endDate = emp.isActive ? qEnd : (emp.endDate || new Date());
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      const effEnd = new Date(Math.min(qEnd.getTime(), endDateObj.getTime()));

      if (effEnd >= effStart) {
        const days = calculateWorkingDays(effStart, effEnd);
        teamWorkingDays += days;
        intervals.push({ start: effStart, end: effEnd });
      }
    } else {
      return null;
    }

    const adjustedTarget = (baseQuarterlyTarget / 90) * teamWorkingDays;
    let achievedSalesValue = 0;

    const empSales = salesByEmp.get(empIdStr) || [];
    for (const { sale } of empSales) {
      const cDate = new Date(sale.contractDate);
      const inInterval = intervals.some(interval => cDate >= interval.start && cDate <= interval.end);
      if (inInterval) {
        achievedSalesValue += (sale.unitValue || 0);
      }
    }

    const achievementPercentage = adjustedTarget > 0 ? (achievedSalesValue / adjustedTarget) * 100 : 0;

    return {
      employeeId: emp._id,
      name: emp.name,
      code: emp.code,
      adjustedTarget: Math.round(adjustedTarget),
      achieved: Math.round(achievedSalesValue),
      achievedSalesValue: Math.round(achievedSalesValue),
      achievementPercentage: Math.round(achievementPercentage * 10) / 10
    };
  };

  const getLeaderPersonalPerf = (leaderIdStr) => {
    const emp = empMap.get(leaderIdStr);
    if (!emp) return null;

    let achievedSalesValue = 0;
    const empSales = salesByEmp.get(leaderIdStr) || [];
    for (const { sale } of empSales) {
      const cDate = new Date(sale.contractDate);
      if (cDate >= qStart && cDate <= qEnd) {
        achievedSalesValue += (sale.unitValue || 0);
      }
    }

    return {
      achievedSalesValue: Math.round(achievedSalesValue),
      achievementPercentage: 0
    };
  };

  const resultsMap = new Map();
  const teamLeaderPerfMap = new Map();

  // Pass 1: Teams led by TeamLeaders (or anything not SalesManager)
  for (const team of teams) {
    if (team.teamLeaderId?.seniorityLevel === 'SalesManager') continue;

    let totalAdjustedTarget = 0;
    let totalAchieved = 0;
    const membersPerformance = [];

    const teamHistories = allHistories.filter(h => h.teamId && h.teamId.toString() === team._id.toString());
    const historyMemberIds = teamHistories.map(h => h.employeeId.toString());
    const currentMemberIds = (team.memberIds || []).map(m => m._id ? m._id.toString() : m.toString());
    const uniqueMemberIds = [...new Set([...historyMemberIds, ...currentMemberIds])];

    for (const memberId of uniqueMemberIds) {
      if (!mongoose.isValidObjectId(memberId)) continue;
      if (team.teamLeaderId && team.teamLeaderId._id.toString() === memberId) continue;

      const memberPerf = getMemberTeamPerf(memberId, team._id.toString());
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

    if (team.teamLeaderId) {
      const leaderProg = getLeaderPersonalPerf(team.teamLeaderId._id.toString());
      if (leaderProg) {
        totalAchieved += leaderProg.achievedSalesValue || 0;
        membersPerformance.push({
          employeeId: team.teamLeaderId._id,
          name: team.teamLeaderId.name + ' (Leader)',
          code: team.teamLeaderId.code,
          adjustedTarget: 0,
          achieved: Math.round(leaderProg.achievedSalesValue),
          achievementPercentage: 0
        });
      }
    }

    const overallAchPct = totalAdjustedTarget > 0 ? Math.round((totalAchieved / totalAdjustedTarget) * 1000) / 10 : 0;
    teamLeaderPerfMap.set(team.teamLeaderId?._id?.toString(), {
      adjustedTarget: totalAdjustedTarget,
      achieved: totalAchieved,
      achievementPercentage: overallAchPct
    });

    resultsMap.set(team._id.toString(), {
      ...team,
      performance: {
        totalAdjustedTarget: Math.round(totalAdjustedTarget),
        totalAchieved: Math.round(totalAchieved),
        overallAchievementPercentage: overallAchPct,
        membersPerformance
      }
    });
  }

  // Pass 2: Teams led by SalesManagers
  for (const team of teams) {
    if (team.teamLeaderId?.seniorityLevel !== 'SalesManager') continue;

    let totalAdjustedTarget = 0;
    let totalAchieved = 0;
    const membersPerformance = [];

    const teamHistories = allHistories.filter(h => h.teamId && h.teamId.toString() === team._id.toString());
    const historyMemberIds = teamHistories.map(h => h.employeeId.toString());
    const currentMemberIds = (team.memberIds || []).map(m => m._id ? m._id.toString() : m.toString());
    const uniqueMemberIds = [...new Set([...historyMemberIds, ...currentMemberIds])];

    for (const memberId of uniqueMemberIds) {
      if (!mongoose.isValidObjectId(memberId)) continue;
      if (team.teamLeaderId && team.teamLeaderId._id.toString() === memberId) continue;

      const emp = empMap.get(memberId);
      if (!emp) continue;

      if (emp.seniorityLevel === 'TeamLeader') {
        const tlPerf = teamLeaderPerfMap.get(memberId);
        if (tlPerf && tlPerf.adjustedTarget > 0) {
          totalAdjustedTarget += tlPerf.adjustedTarget;
          totalAchieved += tlPerf.achieved;
          membersPerformance.push({
            employeeId: emp._id,
            name: emp.name,
            code: emp.code,
            adjustedTarget: tlPerf.adjustedTarget,
            achieved: tlPerf.achieved,
            achievementPercentage: tlPerf.achievementPercentage
          });
        } else {
          const memberPerf = getMemberTeamPerf(memberId, team._id.toString());
          if (memberPerf) {
            totalAdjustedTarget += memberPerf.adjustedTarget;
            totalAchieved += memberPerf.achievedSalesValue;
            membersPerformance.push(memberPerf);
          }
        }
      } else {
        const memberPerf = getMemberTeamPerf(memberId, team._id.toString());
        if (memberPerf) {
          totalAdjustedTarget += memberPerf.adjustedTarget;
          totalAchieved += memberPerf.achievedSalesValue;
          membersPerformance.push(memberPerf);
        }
      }
    }

    if (team.teamLeaderId) {
      const leaderProg = getLeaderPersonalPerf(team.teamLeaderId._id.toString());
      if (leaderProg) {
        totalAchieved += leaderProg.achievedSalesValue || 0;
        membersPerformance.push({
          employeeId: team.teamLeaderId._id,
          name: team.teamLeaderId.name + ' (Leader)',
          code: team.teamLeaderId.code,
          adjustedTarget: 0,
          achieved: Math.round(leaderProg.achievedSalesValue),
          achievementPercentage: 0
        });
      }
    }

    const overallAchPct = totalAdjustedTarget > 0 ? Math.round((totalAchieved / totalAdjustedTarget) * 1000) / 10 : 0;
    resultsMap.set(team._id.toString(), {
      ...team,
      performance: {
        totalAdjustedTarget: Math.round(totalAdjustedTarget),
        totalAchieved: Math.round(totalAchieved),
        overallAchievementPercentage: overallAchPct,
        membersPerformance
      }
    });
  }

  return teams.map(t => resultsMap.get(t._id.toString()) ?? { ...t, performance: null });
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
