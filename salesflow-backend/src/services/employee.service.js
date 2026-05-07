const mongoose = require('mongoose');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const Team = require('../models/team.model');
const Sale = require('../models/sale.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId, getQuarterBounds, calculateEmployeeQuarterDays, calculateWorkingDays } = require('../utils/quarter.utils');
const { paginate } = require('../utils/pagination.utils');

const createEmployee = async (data) => {
  // 1. Format code if provided, otherwise generate
  let code = data.code;
  if (code) {
    const codeStr = String(code).trim();
    if (/^\d+$/.test(codeStr)) {
      code = `EMP-${codeStr.padStart(4, '0')}`;
    } else if (!codeStr.startsWith('EMP-')) {
      code = `EMP-${codeStr}`;
    } else {
      code = codeStr;
    }
  } else {
    code = await generateCode(Employee, 'code', 'EMP');
  }

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

  const paginatedResult = await paginate(Employee, filter, { page, limit, sort, populate: 'currentTeamId managerId' });
  
  // Enrich with dynamic quarterly target progress if they are in Sales
  if (paginatedResult && paginatedResult.data) {
    const currentQuarter = getQuarterId(new Date());
    const enrichedDocs = [];
    for (const emp of paginatedResult.data) {
      const empObj = emp.toObject ? emp.toObject() : emp;
      if (empObj.department === 'Sales') {
        try {
          const progress = await getTargetProgress(empObj._id.toString(), currentQuarter);
          // Override static target with dynamic adjusted target!
          empObj.target = progress.adjustedTarget;
          empObj.fullTarget = progress.fullTarget;
          empObj.achievedSales = progress.achievedSales;
          empObj.achievementPercentage = progress.achievementPercentage;
        } catch (err) {
          // Fallback to static target if any issues
          empObj.adjustedTarget = empObj.target;
        }
      }
      enrichedDocs.push(empObj);
    }
    paginatedResult.data = enrichedDocs;
  }
  
  return paginatedResult;
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

    // 3. Attach dynamic target progress
    if (employee.department === 'Sales') {
      try {
        const progress = await getTargetProgress(id, currentQuarter);
        employee.target = progress.adjustedTarget;
        employee.fullTarget = progress.fullTarget;
        employee.achievedSales = progress.achievedSales;
        employee.achievementPercentage = progress.achievementPercentage;
      } catch (err) {
        employee.adjustedTarget = employee.target;
      }
    }
  }
  return employee;
};

const updateEmployee = async (id, data) => {
  const employee = await Employee.findById(id);
  if (!employee) throw new Error('Employee not found');

  // Format code if provided
  if (data.code) {
    const codeStr = String(data.code).trim();
    if (/^\d+$/.test(codeStr)) {
      data.code = `EMP-${codeStr.padStart(4, '0')}`;
    } else if (!codeStr.startsWith('EMP-')) {
      data.code = `EMP-${codeStr}`;
    } else {
      data.code = codeStr;
    }
  }

  // Recalculate working days if hireDate or endDate changed
  if (data.hireDate || data.endDate || data.isActive === false) {
    const end = data.endDate ? new Date(data.endDate) : (data.isActive === false ? new Date() : new Date());
    data.totalWorkingDays = calculateWorkingDays(data.hireDate || employee.hireDate, end);
  }

  // Check if currentTeamId is changing
  if (data.currentTeamId !== undefined) {
    const oldTeamId = employee.currentTeamId ? employee.currentTeamId.toString() : null;
    const newTeamId = data.currentTeamId ? data.currentTeamId.toString() : null;

    if (newTeamId !== oldTeamId) {
      const today = new Date();
      const quarterId = getQuarterId(today);

      // 1. Pull from old team
      if (oldTeamId) {
        await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: employee._id } });
        await EmployeeTeamHistory.findOneAndUpdate(
          { employeeId: employee._id, teamId: oldTeamId, leaveDate: null },
          { leaveDate: today }
        );
      }

      // 2. Push to new team
      if (newTeamId) {
        await Team.findByIdAndUpdate(newTeamId, { $addToSet: { memberIds: employee._id } });
        // Close any other open histories
        await EmployeeTeamHistory.updateMany(
          { employeeId: employee._id, leaveDate: null },
          { leaveDate: today }
        );
        // Create new history
        await EmployeeTeamHistory.create({
          employeeId: employee._id,
          teamId: newTeamId,
          joinDate: data.teamJoinDate || today,
          quarterId
        });
      }
    }
  }

  return await Employee.findByIdAndUpdate(id, data, { returnDocument: 'after' }).populate('currentTeamId managerId');
};

const deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) throw new Error('Employee not found');

  // 1. Remove employee from their team's memberIds if they belong to a team
  if (employee.currentTeamId) {
    await Team.findByIdAndUpdate(
      employee.currentTeamId,
      { $pull: { memberIds: employee._id } }
    );
  }

  // 2. Delete team history records for this employee
  await EmployeeTeamHistory.deleteMany({ employeeId: employee._id });

  // 3. Delete sales associated with this employee
  await Sale.deleteMany({ employeeId: employee._id });

  // 4. Delete employee permanently from DB
  return await Employee.findByIdAndDelete(id);
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
  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);
  
  let actualWorkingDays = 0;
  const intervals = [];

  // Find all history records for this employee during this quarter
  const histories = await EmployeeTeamHistory.find({
    employeeId: empId,
    quarterId
  }).lean();

  if (histories.length > 0) {
    actualWorkingDays = calculateEmployeeQuarterDays(histories, quarterId);
    
    for (const h of histories) {
      const joinDateObj = new Date(h.joinDate);
      joinDateObj.setHours(0, 0, 0, 0); // Normalize to start of day
      const start = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

      const leaveDate = h.leaveDate ? new Date(h.leaveDate) : (employee.isActive ? qEnd : (employee.endDate || new Date()));
      const leaveDateObj = new Date(leaveDate);
      leaveDateObj.setHours(23, 59, 59, 999); // Normalize to end of day
      const end = new Date(Math.min(qEnd.getTime(), leaveDateObj.getTime()));

      if (end >= start) {
        intervals.push({ start, end });
      }
    }
  } else {
    // 2. If independent: calculate working days from company hireDate to end of quarter
    const joinDate = employee.hireDate || employee.createdAt;
    const joinDateObj = new Date(joinDate);
    joinDateObj.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const start = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));
    
    const endDate = employee.isActive ? qEnd : (employee.endDate || new Date());
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Normalize to end of day
    
    const end = new Date(Math.min(qEnd.getTime(), endDateObj.getTime()));
    
    if (end >= start) {
      actualWorkingDays = calculateWorkingDays(start, end);
      intervals.push({ start, end });
    }
  }

  const adjustedTarget = (employee.target / 90) * actualWorkingDays;
  
  const salesQuery = {
    status: { $in: ['confirmed', 'claimed', 'collected'] },
    isActive: true,
    $and: [
      {
        $or: [
          { 'sellers.employeeId': employeeId },
          { 'sellers.employeeId': empId }
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
    return {
      employeeId,
      employeeName: employee.name,
      code: employee.code,
      quarterId,
      fullTarget: employee.target,
      actualWorkingDays: 0,
      adjustedTarget: 0,
      achievedSales: 0,
      achievedSalesValue: 0,
      achievedCommission: 0,
      clientsCount: 0,
      achievementPercentage: 0,
      gap: employee.target,
      sales: []
    };
  }

  const sales = await Sale.find(salesQuery).lean();

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

  const targetToUse = adjustedTarget > 0 ? adjustedTarget : employee.target;
  const achievementPercentage = targetToUse > 0 ? (achievedSalesValue / targetToUse) * 100 : 0;
  const gap = Math.max(0, targetToUse - achievedSalesValue);

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

  const isSM = employee.seniorityLevel === 'SalesManager';
  const isTL = employee.seniorityLevel === 'TeamLeader';

  let result;

  if (isSM) {
    // A SalesManager's team is defined by active Team Leaders reporting to them
    const teamLeaders = await Employee.find({
      managerId: employeeId,
      seniorityLevel: 'TeamLeader',
      isActive: true
    });

    if (teamLeaders.length > 0) {
      const teamLeadersProgress = [];
      for (const leader of teamLeaders) {
        const leaderProgress = await getTargetProgress(leader._id.toString(), quarterId);
        teamLeadersProgress.push(leaderProgress);
      }

      let totalFullTarget = 0;
      let totalAdjustedTarget = 0;
      let totalAchievedSales = 0;
      let totalAchievedCommission = 0;

      for (const lp of teamLeadersProgress) {
        totalFullTarget += Math.round(lp.fullTarget);
        totalAdjustedTarget += Math.round(lp.adjustedTarget);
        totalAchievedSales += Math.round(lp.achievedSalesValue || lp.achievedSales || 0);
        totalAchievedCommission += Math.round(lp.achievedCommission || 0);
      }

      // SalesManager's own personal target is 0 since they have team leaders, but their personal sales are added
      const personalProgress = await getPersonalTargetProgressOnly(employee, quarterId);
      personalProgress.fullTarget = 0;
      personalProgress.adjustedTarget = 0;
      
      totalAchievedSales += personalProgress.achievedSales;
      totalAchievedCommission += personalProgress.achievedCommission;

      const achievementPercentage = totalAdjustedTarget > 0 ? (totalAchievedSales / totalAdjustedTarget) * 100 : 0;

      result = {
        employeeId,
        employeeName: employee.name,
        code: employee.code,
        quarterId,
        fullTarget: Math.round(totalFullTarget),
        actualWorkingDays: personalProgress.actualWorkingDays,
        adjustedTarget: Math.round(totalAdjustedTarget),
        achievedSales: Math.round(totalAchievedSales),
        achievedSalesValue: Math.round(totalAchievedSales),
        achievedCommission: Math.round(totalAchievedCommission),
        achievementPercentage: Math.round(achievementPercentage * 10) / 10,
        gap: Math.round(Math.max(0, totalAdjustedTarget - totalAchievedSales)),
        teamMembersCount: teamLeaders.length,
        personalProgress,
        membersProgress: teamLeadersProgress
      };
    } else {
      // Exceptional case: SalesManager without reporting Team Leaders -> individual target mode
      result = { ...await getPersonalTargetProgressOnly(employee, quarterId) };
    }
  } else if (isTL) {
    // Find if this employee is a leader of an active team in Team collection
    const team = await Team.findOne({ teamLeaderId: employeeId, isActive: true }).populate('memberIds');
    const teamMembers = team ? team.memberIds.filter(m => m._id.toString() !== employeeId && m.isActive) : [];

    if (team && teamMembers.length > 0) {
      const membersProgress = [];
      let totalFullTarget = 0;
      let totalAdjustedTarget = 0;
      let totalAchievedSales = 0;
      let totalAchievedCommission = 0;

      for (const member of teamMembers) {
        const memberProgress = await getTargetProgress(member._id.toString(), quarterId);
        totalFullTarget += Math.round(memberProgress.fullTarget);
        totalAdjustedTarget += Math.round(memberProgress.adjustedTarget);
        totalAchievedSales += Math.round(memberProgress.achievedSalesValue || memberProgress.achievedSales || 0);
        totalAchievedCommission += Math.round(memberProgress.achievedCommission || 0);
        membersProgress.push(memberProgress);
      }

      // TeamLeader's own personal target is 0 since they have a team, but their personal sales are added
      const personalProgress = await getPersonalTargetProgressOnly(employee, quarterId);
      personalProgress.fullTarget = 0;
      personalProgress.adjustedTarget = 0;

      totalAchievedSales += personalProgress.achievedSales;
      totalAchievedCommission += personalProgress.achievedCommission;

      const achievementPercentage = totalAdjustedTarget > 0 ? (totalAchievedSales / totalAdjustedTarget) * 100 : 0;

      result = {
        employeeId,
        employeeName: employee.name,
        code: employee.code,
        quarterId,
        fullTarget: Math.round(totalFullTarget),
        actualWorkingDays: personalProgress.actualWorkingDays,
        adjustedTarget: Math.round(totalAdjustedTarget),
        achievedSales: Math.round(totalAchievedSales),
        achievedSalesValue: Math.round(totalAchievedSales),
        achievedCommission: Math.round(totalAchievedCommission),
        achievementPercentage: Math.round(achievementPercentage * 10) / 10,
        gap: Math.round(Math.max(0, totalAdjustedTarget - totalAchievedSales)),
        teamMembersCount: teamMembers.length,
        personalProgress,
        membersProgress
      };
    } else {
      // Exceptional case: TeamLeader without team members -> individual target mode
      result = { ...await getPersonalTargetProgressOnly(employee, quarterId) };
    }
  } else {
    // Regular Sales Agent
    result = { ...await getPersonalTargetProgressOnly(employee, quarterId) };
  }

  // Explicitly decorate with role and mode flags so the frontend can display them beautifully
  result.isSalesManager = isSM;
  result.isTeamLeader = isTL;

  return result;
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

  // If this history record is active (no leaveDate), update employee currentTeamId and Team memberIds
  if (!lDate && teamId) {
    employee.currentTeamId = teamId;
    employee.teamJoinDate = jDate;
    await employee.save();

    await Team.findByIdAndUpdate(teamId, { $addToSet: { memberIds: employeeId } });
  }

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

  // Pull employee from the Team memberIds when history record is deleted
  if (history.teamId) {
    await Team.findByIdAndUpdate(history.teamId, { $pull: { memberIds: history.employeeId } });
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
