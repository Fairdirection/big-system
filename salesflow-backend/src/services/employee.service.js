const mongoose = require('mongoose');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const Team = require('../models/team.model');
const Sale = require('../models/sale.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId, getQuarterBounds, calculateEmployeeQuarterDays, calculateWorkingDays } = require('../utils/quarter.utils');
const { paginate } = require('../utils/pagination.utils');

const createEmployee = async (data) => {
  // 1. Generate code if not provided
  const code = data.code || await generateCode(Employee, 'code', 'EMP');

  // 2. Calculate working days
  const totalWorkingDays = calculateWorkingDays(data.hireDate, new Date());

  // 3. Create employee
  const employee = await Employee.create({
    ...data,
    code,
    totalWorkingDays,
    currentQuarterWorkingDays: (data.department === 'Sales' && data.teamJoinDate)
      ? calculateEmployeeQuarterDays([{ joinDate: data.teamJoinDate }], getQuarterId(new Date()))
      : 0
  });

  // 4. If sales dept + team assigned: create history record + update team
  if (data.department === 'Sales' && data.currentTeamId) {
    const quarterId = getQuarterId(new Date(data.teamJoinDate));
    await EmployeeTeamHistory.create({
      employeeId: employee._id,
      teamId: data.currentTeamId,
      joinDate: data.teamJoinDate,
      quarterId
    });
    await Team.findByIdAndUpdate(
      data.currentTeamId,
      { $addToSet: { memberIds: employee._id } }
    );
  }

  return employee;
};

const getEmployees = async (query) => {
  const { department, isActive, search, seniorityLevel, teamId, page, limit, sortBy, order } = query;
  
  const filter = {};
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (seniorityLevel) filter.seniorityLevel = seniorityLevel;
  
  if (teamId === 'none') {
    filter.$or = [
      { currentTeamId: null },
      { currentTeamId: { $exists: false } }
    ];
  } else if (teamId) {
    filter.currentTeamId = teamId;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = order === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  return await paginate(Employee, filter, { page, limit, sort, populate: 'currentTeamId managerId' });
};

const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id).populate('currentTeamId managerId').lean();
  if (employee) {
    // 1. Total seniority since hire
    const end = employee.endDate || (employee.isActive ? new Date() : new Date());
    employee.currentSeniorityDays = calculateWorkingDays(employee.hireDate, end);

    // 2. Days worked in current quarter across all teams (until today)
    const currentQuarter = getQuarterId(new Date());
    const history = await EmployeeTeamHistory.find({ employeeId: id });
    employee.dynamicQuarterDays = calculateEmployeeQuarterDays(history, currentQuarter, true);
  }
  return employee;
};

const updateEmployee = async (id, data) => {
  const employee = await Employee.findById(id);
  if (!employee) throw new Error('Employee not found');

  // Recalculate working days if hireDate or endDate changed
  if (data.hireDate || data.endDate || data.isActive === false) {
    const end = data.endDate ? new Date(data.endDate) : (data.isActive === false ? new Date() : new Date());
    data.totalWorkingDays = calculateWorkingDays(data.hireDate || employee.hireDate, end);
  }

  return await Employee.findByIdAndUpdate(id, data, { returnDocument: 'after' }).populate('currentTeamId managerId');
};

const deleteEmployee = async (id) => {
  return await Employee.findByIdAndUpdate(id, { 
    isActive: false, 
    endDate: new Date() 
  }, { returnDocument: 'after' });
};

const getTeamHistory = async (employeeId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return [];

  const history = await EmployeeTeamHistory.find({ employeeId }).populate('teamId').sort({ joinDate: 1 }).lean();
  
  // 3. Fetch sales to calculate achievement per segment
  const sales = await Sale.find({
    'sellers.employeeId': employeeId,
    status: { $ne: 'draft' },
    isActive: true
  });

  const timeline = [];
  let currentDate = new Date(employee.hireDate);

  for (const record of history) {
    const joinDate = new Date(record.joinDate);
    
    // Check for gap between currentDate and joinDate
    if (joinDate > currentDate) {
      timeline.push({
        type: 'no-team',
        isInitial: currentDate.getTime() === employee.hireDate.getTime(),
        name: 'بدون فريق',
        startDate: currentDate,
        endDate: joinDate,
        durationDays: calculateWorkingDays(currentDate, joinDate) - 1,
        achievement: 0 // Gap periods have 0 achievement usually, but we could check sales here too if needed
      });
    }

    // Calculate achievement in this period
    const start = joinDate;
    const end = record.leaveDate ? new Date(record.leaveDate) : new Date();
    const periodSales = sales.filter(s => {
      const contractDate = new Date(s.contractDate);
      return contractDate >= start && contractDate <= end;
    });

    const achievement = periodSales.reduce((sum, s) => {
      const seller = s.sellers.find(sel => sel.employeeId.toString() === employeeId.toString());
      return sum + (s.unitValue * (seller.sharePercentage / 100));
    }, 0);

    timeline.push({
      historyId: record._id,
      type: record.teamId ? 'team' : 'no-team',
      name: record.teamId ? (record.teamId.name || 'فريق محذوف') : 'بدون فريق',
      teamId: record.teamId ? record.teamId._id : null,
      startDate: joinDate,
      endDate: record.leaveDate,
      durationDays: calculateWorkingDays(joinDate, record.leaveDate || new Date()),
      achievement: Math.round(achievement)
    });

    if (record.leaveDate) {
      currentDate = new Date(record.leaveDate);
    } else {
      currentDate = null;
      break;
    }
  }

  // If there's time left after the last record and employee is active
  if (currentDate && employee.isActive) {
    const now = new Date();
    if (now > currentDate) {
      // Calculate achievement for the current unassigned period
      const periodSales = sales.filter(s => new Date(s.contractDate) >= currentDate);
      const achievement = periodSales.reduce((sum, s) => {
        const seller = s.sellers.find(sel => sel.employeeId.toString() === employeeId.toString());
        return sum + (s.unitValue * (seller.sharePercentage / 100));
      }, 0);

      timeline.push({
        type: 'no-team',
        name: 'بدون فريق (حالي)',
        startDate: currentDate,
        endDate: null,
        durationDays: calculateWorkingDays(currentDate, now),
        achievement: Math.round(achievement)
      });
    }
  } else if (!history.length && employee.isActive) {
    // No history at all, count all sales
    const achievement = sales.reduce((sum, s) => {
      const seller = s.sellers.find(sel => sel.employeeId.toString() === employeeId.toString());
      return sum + (s.unitValue * (seller.sharePercentage / 100));
    }, 0);

    timeline.push({
      type: 'no-team',
      name: 'بدون فريق',
      startDate: currentDate,
      endDate: null,
      durationDays: calculateWorkingDays(currentDate, new Date()),
      achievement: Math.round(achievement)
    });
  }

  const result = timeline.reverse();
  
  // Calculate summary stats
  const totalSeniority = calculateWorkingDays(employee.hireDate, new Date());
  const currentQuarter = getQuarterId(new Date());
  const quarterDays = calculateEmployeeQuarterDays(history, currentQuarter);

  // Aggregate days per team
  const teamStats = history.reduce((acc, curr) => {
    const teamName = curr.teamId?.name || 'بدون فريق';
    const days = calculateWorkingDays(curr.joinDate, curr.leaveDate || new Date());
    acc[teamName] = (acc[teamName] || 0) + days;
    return acc;
  }, {});

  // Convert to array for easier UI iteration
  const aggregatedTeams = Object.entries(teamStats).map(([name, days]) => ({ name, days }));

  return {
    timeline: result,
    stats: {
      totalSeniorityDays: totalSeniority,
      quarterWorkingDays: quarterDays,
      teamStats: aggregatedTeams
    }
  };
};

const transferTeam = async (employeeId, { newTeamId, transferDate }) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');
  if (employee.department !== 'Sales') throw new Error('Only Sales employees can be transferred between teams');

  const tDate = new Date(transferDate);
  const quarterId = getQuarterId(tDate);

  // 1. Find current active history record
  const oldHistory = await EmployeeTeamHistory.findOne({ employeeId, leaveDate: null });
  if (oldHistory) {
    oldHistory.leaveDate = tDate;
    oldHistory.workingDaysInTeam = calculateWorkingDays(oldHistory.joinDate, tDate);
    await oldHistory.save();

    // Remove from old team
    await Team.findByIdAndUpdate(oldHistory.teamId, { $pull: { memberIds: employeeId } });
  }

  // 2. Create new history record
  await EmployeeTeamHistory.create({
    employeeId,
    teamId: newTeamId,
    joinDate: tDate,
    quarterId
  });

  // 3. Update employee
  employee.currentTeamId = newTeamId;
  employee.teamJoinDate = tDate;
  
  // Recalculate current quarter working days
  const history = await EmployeeTeamHistory.find({ employeeId });
  employee.currentQuarterWorkingDays = calculateEmployeeQuarterDays(history, quarterId);
  
  await employee.save();

  // 4. Add to new team
  await Team.findByIdAndUpdate(newTeamId, { $addToSet: { memberIds: employeeId } });

  return employee;
};

const getPersonalTargetProgressOnly = async (employeeOrId, quarterId) => {
  let employee;
  if (typeof employeeOrId === 'string' || mongoose.isValidObjectId(employeeOrId)) {
    employee = await Employee.findById(employeeOrId);
  } else {
    employee = employeeOrId;
  }

  if (!employee || employee.department !== 'Sales') {
    throw new Error('Employee not found or not in Sales department');
  }

  const employeeId = employee._id.toString();
  const empId = new mongoose.Types.ObjectId(employeeId);
  
  const history = await EmployeeTeamHistory.find({ employeeId: empId });
  let actualWorkingDays = calculateEmployeeQuarterDays(history, quarterId);
  
  // Fallback: if no history but employee has a current team, assume they joined at start of quarter or their joinDate
  if (actualWorkingDays === 0 && employee.currentTeamId) {
    const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);
    const joinDate = employee.teamJoinDate || employee.createdAt;
    const effectiveStart = new Date(Math.max(qStart, new Date(joinDate)));
    const effectiveEnd = new Date(Math.min(qEnd, new Date()));
    if (effectiveEnd > effectiveStart) {
      actualWorkingDays = calculateWorkingDays(effectiveStart, effectiveEnd);
    }
  }

  const adjustedTarget = (employee.target / 90) * actualWorkingDays;

  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);
  
  const sales = await Sale.find({
    status: { $in: ['confirmed', 'claimed', 'collected'] },
    isActive: true,
    $and: [
      {
        $or: [
          { 'sellers.employeeId': employeeId },
          { 'sellers.employeeId': empId }
        ]
      },
      {
        $or: [
          { quarterId: quarterId },
          { contractDate: { $gte: qStart, $lte: qEnd } }
        ]
      }
    ]
  }).lean();

  let achievedSalesValue = 0;
  let achievedCommission = 0;
  const uniqueClients = new Set();

  sales.forEach(sale => {
    const seller = sale.sellers.find(s => {
      const sId = s.employeeId?._id ? s.employeeId._id.toString() : s.employeeId?.toString();
      return sId === employeeId;
    });
    if (seller) {
      achievedSalesValue += (sale.unitValue || 0); 
      achievedCommission += (seller.commissionValue || 0);
      if (sale.clientId) uniqueClients.add(sale.clientId.toString());
    }
  });

  const achievementPercentage = employee.target > 0 ? (achievedSalesValue / employee.target) * 100 : 0;
  const gap = employee.target - achievedSalesValue;

  return {
    employeeId,
    employeeName: employee.name,
    code: employee.code,
    quarterId,
    fullTarget: employee.target,
    actualWorkingDays,
    adjustedTarget: Math.round(adjustedTarget),
    achievedSales: Math.round(achievedSalesValue),
    achievedSalesValue: Math.round(achievedSalesValue),
    achievedCommission: Math.round(achievedCommission),
    clientsCount: uniqueClients.size,
    achievementPercentage: Math.round(achievementPercentage * 10) / 10,
    gap: Math.round(gap),
    sales: sales.map(s => ({
      _id: s._id,
      projectName: s.projectName,
      unitNumber: s.unitNumber,
      unitValue: s.unitValue,
      contractDate: s.contractDate,
      clientName: s.clientName,
      status: s.status
    }))
  };
};

const getTargetProgress = async (employeeId, quarterId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee || employee.department !== 'Sales') {
    throw new Error('Employee not found or not in Sales department');
  }

  // Find if this employee is a leader of an active team
  const team = await Team.findOne({ teamLeaderId: employeeId, isActive: true }).populate('memberIds');

  if (team) {
    const membersProgress = [];
    let totalAdjustedTarget = 0;
    let totalAchievedSales = 0;
    let totalAchievedCommission = 0;

    for (const member of team.memberIds) {
      const memberProgress = await getTargetProgress(member._id.toString(), quarterId);
      totalAdjustedTarget += Math.round(memberProgress.adjustedTarget);
      totalAchievedSales += Math.round(memberProgress.achievedSalesValue);
      totalAchievedCommission += Math.round(memberProgress.achievedCommission);
      membersProgress.push(memberProgress);
    }

    // Now calculate the leader's own personal target and sales
    const personalProgress = await getPersonalTargetProgressOnly(employee, quarterId);

    totalAdjustedTarget += personalProgress.adjustedTarget;
    totalAchievedSales += personalProgress.achievedSales;
    totalAchievedCommission += personalProgress.achievedCommission;

    const achievementPercentage = totalAdjustedTarget > 0 ? (totalAchievedSales / totalAdjustedTarget) * 100 : 0;

    return {
      employeeId,
      employeeName: employee.name,
      code: employee.code,
      quarterId,
      isTeamLeader: true,
      fullTarget: Math.round(totalAdjustedTarget),
      actualWorkingDays: personalProgress.actualWorkingDays,
      adjustedTarget: Math.round(totalAdjustedTarget),
      achievedSales: Math.round(totalAchievedSales),
      achievedSalesValue: Math.round(totalAchievedSales),
      achievedCommission: Math.round(totalAchievedCommission),
      achievementPercentage: Math.round(achievementPercentage * 10) / 10,
      gap: Math.round(Math.max(0, totalAdjustedTarget - totalAchievedSales)),
      teamMembersCount: team.memberIds.length,
      personalProgress,
      membersProgress
    };
  } else {
    return await getPersonalTargetProgressOnly(employee, quarterId);
  }
};

const getSalesDeptEmployees = async () => {
  return await Employee.find({ department: 'Sales', isActive: true }).select('name code');
};

const updateHistoryRecord = async (historyId, data) => {
  const history = await EmployeeTeamHistory.findById(historyId);
  if (!history) throw new Error('History record not found');

  if (data.joinDate) history.joinDate = new Date(data.joinDate);
  if (data.leaveDate !== undefined) {
    history.leaveDate = data.leaveDate ? new Date(data.leaveDate) : null;
  }

  // Recalculate duration
  const end = history.leaveDate || new Date();
  history.workingDaysInTeam = calculateWorkingDays(history.joinDate, end);

  await history.save();
  return history;
};

const addHistoryRecord = async (employeeId, { teamId, joinDate, leaveDate }) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const jDate = new Date(joinDate);
  const lDate = leaveDate ? new Date(leaveDate) : null;
  const quarterId = getQuarterId(jDate);

  const history = await EmployeeTeamHistory.create({
    employeeId,
    teamId: teamId || null,
    joinDate: jDate,
    leaveDate: lDate,
    quarterId
  });

  return history;
};

const deleteHistoryRecord = async (historyId) => {
  const history = await EmployeeTeamHistory.findById(historyId);
  if (!history) throw new Error('History record not found');

  // If this was the active team, clear currentTeamId from employee
  const employee = await Employee.findById(history.employeeId);
  if (employee && employee.currentTeamId?.toString() === history.teamId?.toString() && !history.leaveDate) {
    employee.currentTeamId = null;
    await employee.save();
  }

  await EmployeeTeamHistory.findByIdAndDelete(historyId);
  return { success: true };
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getTeamHistory,
  transferTeam,
  getTargetProgress,
  getPersonalTargetProgressOnly,
  getSalesDeptEmployees,
  updateHistoryRecord,
  deleteHistoryRecord,
  addHistoryRecord
};
