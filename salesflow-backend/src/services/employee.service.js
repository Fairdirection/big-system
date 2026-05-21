const mongoose = require('mongoose');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const Team = require('../models/team.model');
const Sale = require('../models/sale.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId, getQuarterBounds, calculateEmployeeQuarterDays, calculateWorkingDays } = require('../utils/quarter.utils');
const { paginate } = require('../utils/pagination.utils');

const createEmployee = async (data, reqQuarterId) => {
  if (data.email === undefined || data.email === null || data.email === '') {
    data.email = '';
  }
  if (data.phone === undefined || data.phone === null || data.phone === '') {
    data.phone = '';
  }
  if (data.endDate === '') {
    data.endDate = null;
  }

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

  if (reqQuarterId && data.target !== undefined) {
    const QuarterlyTarget = require('../models/quarterly-target.model');
    await QuarterlyTarget.findOneAndUpdate(
      { employeeId: employee._id, quarterId: reqQuarterId },
      { target: Number(data.target) },
      { upsert: true, new: true }
    );
  }

  // 4. If sales dept + team assigned: create history record + update team
  if (data.department === 'Sales' && data.currentTeamId) {
    const quarterId = getQuarterId(new Date(data.teamJoinDate || new Date()));
    await EmployeeTeamHistory.create({
      employeeId: employee._id,
      teamId: data.currentTeamId,
      joinDate: data.teamJoinDate || new Date(),
      quarterId
    });
    const team = await Team.findByIdAndUpdate(
      data.currentTeamId,
      { $addToSet: { memberIds: employee._id } }
    );
    if (team) {
      employee.managerId = team.teamLeaderId;
      await employee.save();
    }
  }

  // Handle SalesManager managed teams
  if (data.department === 'Sales' && data.seniorityLevel === 'SalesManager' && data.managedTeamIds) {
    const today = new Date();
    const quarterId = getQuarterId(today);

    // Find or create a Team led by this Sales Manager
    let salesManagerTeam = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
    if (!salesManagerTeam) {
      salesManagerTeam = await Team.create({
        name: employee.name,
        teamLeaderId: employee._id,
        memberIds: []
      });
    }

    const managedTeams = await Team.find({ _id: { $in: data.managedTeamIds }, isActive: true });
    const teamLeaderIds = managedTeams.map(t => t.teamLeaderId.toString());

    for (const tlId of teamLeaderIds) {
      const leader = await Employee.findById(tlId);
      if (leader) {
        const oldTeamId = leader.currentTeamId ? leader.currentTeamId.toString() : null;
        if (oldTeamId && oldTeamId !== salesManagerTeam._id.toString()) {
          await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: tlId } });
          await EmployeeTeamHistory.findOneAndUpdate(
            { employeeId: tlId, teamId: oldTeamId, leaveDate: null },
            { leaveDate: today }
          );
        }
        await Employee.findByIdAndUpdate(tlId, { currentTeamId: salesManagerTeam._id, managerId: employee._id, teamJoinDate: today });
        await EmployeeTeamHistory.create({
          employeeId: tlId,
          teamId: salesManagerTeam._id,
          joinDate: today,
          quarterId
        });
      }
    }

    salesManagerTeam.memberIds = teamLeaderIds.map(id => new mongoose.Types.ObjectId(id));
    await salesManagerTeam.save();
  }

  // Handle TeamLeader team members
  if (data.department === 'Sales' && data.seniorityLevel === 'TeamLeader' && data.teamMemberIds) {
    const today = new Date();
    const quarterId = getQuarterId(today);

    let team = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
    if (!team) {
      team = await Team.create({
        name: employee.name,
        teamLeaderId: employee._id,
        memberIds: []
      });
    }

    const newMemberIds = data.teamMemberIds.map(id => id.toString());

    for (const mId of newMemberIds) {
      const member = await Employee.findById(mId);
      if (member) {
        const oldTeamId = member.currentTeamId ? member.currentTeamId.toString() : null;
        if (oldTeamId && oldTeamId !== team._id.toString()) {
          await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: mId } });
          await EmployeeTeamHistory.findOneAndUpdate(
            { employeeId: mId, teamId: oldTeamId, leaveDate: null },
            { leaveDate: today }
          );
        }
        await Employee.findByIdAndUpdate(mId, { currentTeamId: team._id, managerId: employee._id, teamJoinDate: today });
        await EmployeeTeamHistory.create({
          employeeId: mId,
          teamId: team._id,
          joinDate: today,
          quarterId
        });
      }
    }

    team.memberIds = newMemberIds.map(id => new mongoose.Types.ObjectId(id));
    await team.save();
  }

  return employee;
};

const getEmployees = async (query) => {
  const { department, isActive, search, seniorityLevel, teamId, page, limit, sortBy, order, includePerformance } = query;
  
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

  // Cap at 500; default to 500 (not 20) so the employee list never silently
  // truncates small teams when no limit is passed from the frontend.
  const safeLimit = Math.min(parseInt(limit) || 500, 500);
  const paginatedResult = await paginate(Employee, filter, { page, limit: safeLimit, sort, populate: 'currentTeamId managerId' });
  
  // Enrich with dynamic quarterly target progress if they are in Sales and requested
  if (paginatedResult && paginatedResult.data && includePerformance === 'true') {
    const currentQuarter = query.quarterId || getQuarterId(new Date());
    const enrichedDocs = [];
    for (const emp of paginatedResult.data) {
      const empObj = emp.toObject ? emp.toObject() : emp;
      if (empObj.isActive === false && !empObj.endDate) {
        empObj.endDate = empObj.updatedAt || new Date();
      }

      if (empObj.department === 'Sales') {
        try {
          const QuarterlyTarget = require('../models/quarterly-target.model');
          const customTarget = await QuarterlyTarget.findOne({ employeeId: empObj._id, quarterId: currentQuarter });
          if (customTarget && customTarget.target !== undefined && customTarget.target !== null) {
            empObj.target = customTarget.target;
            empObj.hasCustomTarget = true;
          }
          const progress = await getTargetProgress(empObj._id, currentQuarter);
          empObj.adjustedTarget = progress.adjustedTarget;
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

const getEmployeeById = async (id, reqQuarterId) => {
  const employee = await Employee.findById(id).populate('currentTeamId managerId').lean();
  if (employee) {
    if (employee.isActive === false && !employee.endDate) {
      employee.endDate = employee.updatedAt || new Date();
    }
    // 1. Total seniority since hire
    const end = employee.endDate || (employee.isActive ? new Date() : new Date());
    employee.currentSeniorityDays = calculateWorkingDays(employee.hireDate, end);

    // 2. Days worked in current quarter across all teams (until today)
    const currentQuarter = reqQuarterId || getQuarterId(new Date());
    const history = await EmployeeTeamHistory.find({ employeeId: id });
    employee.dynamicQuarterDays = calculateEmployeeQuarterDays(history, currentQuarter, true);

    // 3. Attach dynamic target progress
    if (employee.department === 'Sales') {
      try {
        const QuarterlyTarget = require('../models/quarterly-target.model');
        const customTarget = await QuarterlyTarget.findOne({ employeeId: new mongoose.Types.ObjectId(id), quarterId: currentQuarter });
        if (customTarget && customTarget.target !== undefined && customTarget.target !== null) {
          employee.target = customTarget.target;
          employee.hasCustomTarget = true;
        }
        const progress = await getTargetProgress(id, currentQuarter);
        employee.adjustedTarget = progress.adjustedTarget;
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

const updateEmployee = async (id, data, reqQuarterId) => {
  if (data.email === '' || data.email === null) {
    data.email = '';
  }
  if (data.phone === '' || data.phone === null) {
    data.phone = '';
  }
  if (data.endDate === '') {
    data.endDate = null;
  }

  const employee = await Employee.findById(id);
  if (!employee) throw new Error('Employee not found');

  if (reqQuarterId && data.target !== undefined) {
    const QuarterlyTarget = require('../models/quarterly-target.model');
    await QuarterlyTarget.findOneAndUpdate(
      { employeeId: new mongoose.Types.ObjectId(id), quarterId: reqQuarterId },
      { target: Number(data.target) },
      { upsert: true, new: true }
    );
    delete data.target;
  }

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

  // Handle account deactivation / termination
  if (data.isActive === false) {
    const today = new Date();
    data.endDate = data.endDate || today;
    // Cap to today so a future endDate doesn't inflate the stored working days
    const deactivationEnd = new Date(Math.min(new Date(data.endDate).getTime(), today.getTime()));
    data.totalWorkingDays = calculateWorkingDays(data.hireDate || employee.hireDate, deactivationEnd);

    // If they belong to a team, pull them out and close their history
    if (employee.currentTeamId) {
      const oldTeamId = employee.currentTeamId.toString();
      await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: employee._id } });
      await EmployeeTeamHistory.findOneAndUpdate(
        { employeeId: employee._id, teamId: oldTeamId, leaveDate: null },
        { leaveDate: data.endDate }
      );
      data.currentTeamId = null;
    }

    // If they lead a team (TeamLeader), deactivate their team and remove members
    if (employee.seniorityLevel === 'TeamLeader') {
      const tlTeam = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
      if (tlTeam) {
        tlTeam.isActive = false;
        tlTeam.memberIds = [];
        await tlTeam.save();
      }
    }

    // If they are a SalesManager, deactivate their managed team
    if (employee.seniorityLevel === 'SalesManager') {
      const smTeam = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
      if (smTeam) {
        smTeam.isActive = false;
        smTeam.memberIds = [];
        await smTeam.save();
      }
    }
  } else if (data.isActive === true && employee.isActive === false) {
    // Reactivating account
    data.endDate = null;
    data.totalWorkingDays = calculateWorkingDays(data.hireDate || employee.hireDate, new Date());
  } else if (data.hireDate || data.endDate) {
    const end = data.endDate ? new Date(data.endDate) : new Date();
    data.totalWorkingDays = calculateWorkingDays(data.hireDate || employee.hireDate, end);
  }

  // Deactivate team if rank changes from SalesManager to something else
  if (employee.seniorityLevel === 'SalesManager' && data.seniorityLevel && data.seniorityLevel !== 'SalesManager') {
    const salesManagerTeam = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
    if (salesManagerTeam) {
      salesManagerTeam.isActive = false;
      salesManagerTeam.memberIds = [];
      await salesManagerTeam.save();
    }
  }

  // If seniorityLevel is changed to TeamLeader or SalesManager, they can't be a regular team member
  if (data.seniorityLevel === 'TeamLeader' || data.seniorityLevel === 'SalesManager') {
    data.currentTeamId = null;
  }

  // Check if currentTeamId is changing
  if (data.currentTeamId !== undefined) {
    const oldTeamId = employee.currentTeamId ? employee.currentTeamId.toString() : null;
    const newTeamId = data.currentTeamId ? data.currentTeamId.toString() : null;

    if (newTeamId !== oldTeamId) {
      // Use teamJoinDate as the single boundary so old leave and new join share the same date.
      // Using two different dates (today vs teamJoinDate) was creating phantom no-team gaps.
      const switchDate = data.teamJoinDate ? new Date(data.teamJoinDate) : new Date();
      const quarterId  = getQuarterId(switchDate);

      // 1. Pull from old team — close at switchDate
      if (oldTeamId) {
        await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: employee._id } });
        await EmployeeTeamHistory.findOneAndUpdate(
          { employeeId: employee._id, teamId: oldTeamId, leaveDate: null },
          { leaveDate: switchDate }
        );
      }

      // 2. Push to new team — open at the same switchDate
      if (newTeamId) {
        const team = await Team.findById(newTeamId);
        if (team) {
          data.managerId = team.teamLeaderId;
        }
        await Team.findByIdAndUpdate(newTeamId, { $addToSet: { memberIds: employee._id } });
        // Close any remaining open history records at switchDate
        await EmployeeTeamHistory.updateMany(
          { employeeId: employee._id, leaveDate: null },
          { leaveDate: switchDate }
        );
        // Create new history starting at switchDate (no gap)
        await EmployeeTeamHistory.create({
          employeeId: employee._id,
          teamId: newTeamId,
          joinDate: switchDate,
          quarterId
        });
      } else {
        const topManager = await Employee.findOne({ department: 'TopManagement', isActive: true });
        data.managerId = topManager ? topManager._id : '69f60230c2120b7ce02988dd';
      }
    }
  }

  // Handle SalesManager managed teams updates
  if (
    (data.seniorityLevel === 'SalesManager' || (!data.seniorityLevel && employee.seniorityLevel === 'SalesManager')) &&
    data.managedTeamIds !== undefined
  ) {
    const today = new Date();

    // Find or create a Team led by this Sales Manager
    let salesManagerTeam = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
    if (!salesManagerTeam) {
      salesManagerTeam = await Team.create({
        name: data.name || employee.name,
        teamLeaderId: employee._id,
        memberIds: []
      });
    }

    // Fetch selected teams to get their leader IDs
    const managedTeams = await Team.find({ _id: { $in: data.managedTeamIds }, isActive: true });
    const teamLeaderIds = managedTeams.map(t => t.teamLeaderId.toString());

    // Find old Team Leaders who reported to this Sales Manager in their team
    const oldMemberIds = salesManagerTeam.memberIds.map(id => id.toString());

    // Team Leaders to ADD
    const addedLeaders = teamLeaderIds.filter(id => !oldMemberIds.includes(id));
    for (const tlId of addedLeaders) {
      const leader = await Employee.findById(tlId);
      if (leader) {
        // Update managerId to Sales Manager, but DO NOT touch currentTeamId or history!
        await Employee.findByIdAndUpdate(tlId, { managerId: employee._id });
      }
    }

    // Team Leaders to REMOVE
    const removedLeaders = oldMemberIds.filter(id => !teamLeaderIds.includes(id));
    const topManager = await Employee.findOne({ department: 'TopManagement', isActive: true });
    const defaultManagerId = topManager ? topManager._id : '69f60230c2120b7ce02988dd';

    for (const tlId of removedLeaders) {
      const leader = await Employee.findById(tlId);
      if (leader) {
        // Update managerId back to default manager, but DO NOT touch currentTeamId or history!
        await Employee.findByIdAndUpdate(tlId, { managerId: defaultManagerId });
      }
    }

    salesManagerTeam.name = data.name || employee.name;
    salesManagerTeam.memberIds = teamLeaderIds.map(id => new mongoose.Types.ObjectId(id));
    await salesManagerTeam.save();
  }

  // Handle TeamLeader team members updates
  if (
    (data.seniorityLevel === 'TeamLeader' || (!data.seniorityLevel && employee.seniorityLevel === 'TeamLeader')) &&
    data.teamMemberIds !== undefined
  ) {
    const today = new Date();
    const quarterId = getQuarterId(today);

    let team = await Team.findOne({ teamLeaderId: employee._id, isActive: true });
    if (!team) {
      team = await Team.create({
        name: data.name || employee.name,
        teamLeaderId: employee._id,
        memberIds: []
      });
    }

    const newMemberIds = data.teamMemberIds.map(id => id.toString());
    const oldMemberIds = team.memberIds.map(id => id.toString());

    // Members to ADD
    const addedMembers = newMemberIds.filter(id => !oldMemberIds.includes(id));
    for (const mId of addedMembers) {
      const member = await Employee.findById(mId);
      if (member) {
        const oldTeamId = member.currentTeamId ? member.currentTeamId.toString() : null;
        if (oldTeamId && oldTeamId !== team._id.toString()) {
          await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: mId } });
          await EmployeeTeamHistory.findOneAndUpdate(
            { employeeId: mId, teamId: oldTeamId, leaveDate: null },
            { leaveDate: today }
          );
        }
        await Employee.findByIdAndUpdate(mId, { currentTeamId: team._id, managerId: employee._id, teamJoinDate: today });
        await EmployeeTeamHistory.create({
          employeeId: mId,
          teamId: team._id,
          joinDate: today,
          quarterId
        });
      }
    }

    // Members to REMOVE
    const removedMembers = oldMemberIds.filter(id => !newMemberIds.includes(id));
    const topManager = await Employee.findOne({ department: 'TopManagement', isActive: true });
    const defaultManagerId = topManager ? topManager._id : '69f60230c2120b7ce02988dd';
    for (const mId of removedMembers) {
      const m = await Employee.findById(mId);
      if (m) {
        await Employee.findByIdAndUpdate(mId, { currentTeamId: null, managerId: defaultManagerId });
        await EmployeeTeamHistory.findOneAndUpdate(
          { employeeId: mId, teamId: team._id, leaveDate: null },
          { leaveDate: today }
        );
      }
    }

    team.name = data.name || employee.name;
    team.memberIds = newMemberIds.map(id => new mongoose.Types.ObjectId(id));
    await team.save();
  }

  return await Employee.findByIdAndUpdate(id, data, { new: true }).populate('currentTeamId managerId');
};

const deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) throw new Error('Employee not found');

  // Find default manager to reassign reporting employees
  const topManager = await Employee.findOne({ department: 'TopManagement', isActive: true, _id: { $ne: id } });
  const defaultManagerId = topManager ? topManager._id : '69f60230c2120b7ce02988dd';

  // Reassign all employees reporting to this deleted manager to report to the default manager
  await Employee.updateMany({ managerId: id }, { $set: { managerId: defaultManagerId } });

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
  await Sale.deleteMany({ 'sellers.employeeId': employee._id });

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
    
    // Check for gap between currentDate and joinDate.
    // Skip gaps of ≤ 1 day — these are date-boundary artefacts from old data where
    // leaveDate and the next joinDate were stored one day apart instead of matching.
    const gapMs = joinDate.getTime() - currentDate.getTime();
    const gapDays = gapMs / (1000 * 60 * 60 * 24);
    if (gapDays > 1) {
      timeline.push({
        type: 'no-team',
        isInitial: currentDate.getTime() === employee.hireDate.getTime(),
        name: 'no_team',
        startDate: currentDate,
        endDate: joinDate,
        durationDays: calculateWorkingDays(currentDate, joinDate) - 1,
        achievement: 0
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
      name: record.teamId ? (record.teamId.name || 'deleted_team') : 'no_team',
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

  const now = new Date();
  // Effective end: for inactive employees cap to today (future endDate means
  // "scheduled termination" — we must not count days that haven't happened yet)
  const effectiveEnd = (!employee.isActive && employee.endDate)
    ? new Date(Math.min(new Date(employee.endDate).getTime(), now.getTime()))
    : now;

  // If there's time left after the last record and employee is active
  if (currentDate && employee.isActive) {
    if (now > currentDate) {
      const periodSales = sales.filter(s => new Date(s.contractDate) >= currentDate);
      const achievement = periodSales.reduce((sum, s) => {
        const seller = s.sellers.find(sel => sel.employeeId.toString() === employeeId.toString());
        return sum + (s.unitValue * (seller.sharePercentage / 100));
      }, 0);

      timeline.push({
        type: 'no-team',
        name: 'no_team_current',
        isCurrent: true,
        startDate: currentDate,
        endDate: null,
        durationDays: calculateWorkingDays(currentDate, now),
        achievement: Math.round(achievement)
      });
    }
  } else if (!history.length && employee.isActive) {
    // Active employee with no history at all
    const achievement = sales.reduce((sum, s) => {
      const seller = s.sellers.find(sel => sel.employeeId.toString() === employeeId.toString());
      return sum + (s.unitValue * (seller.sharePercentage / 100));
    }, 0);

    timeline.push({
      type: 'no-team',
      name: 'no_team',
      startDate: currentDate,
      endDate: null,
      durationDays: calculateWorkingDays(currentDate, now),
      achievement: Math.round(achievement)
    });
  } else if (!history.length && !employee.isActive && currentDate) {
    // Inactive employee with no team history: show the unassigned period
    // from hire date to effective end (capped to today)
    const achievement = sales.reduce((sum, s) => {
      const seller = s.sellers.find(sel => sel.employeeId.toString() === employeeId.toString());
      return sum + (s.unitValue * (seller.sharePercentage / 100));
    }, 0);

    if (effectiveEnd > currentDate) {
      timeline.push({
        type: 'no-team',
        name: 'no_team',
        startDate: currentDate,
        endDate: effectiveEnd,
        durationDays: calculateWorkingDays(currentDate, effectiveEnd),
        achievement: Math.round(achievement)
      });
    }
  }

  // Add termination event as the most recent entry when employee is deactivated
  if (!employee.isActive) {
    const terminationDate = employee.endDate || employee.updatedAt || now;
    timeline.push({
      type: 'deactivated',
      name: 'إنهاء الخدمة',
      startDate: new Date(terminationDate),
      endDate: null,
      durationDays: 0,
      achievement: 0,
      isTermination: true
    });
  }

  const result = timeline.reverse();

  // Calculate summary stats — cap to effectiveEnd so future endDates
  // don't inflate the seniority counter beyond today
  const totalSeniority = calculateWorkingDays(employee.hireDate, effectiveEnd);
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
    joinDate: { $lte: qEnd },
    $or: [
      { leaveDate: null },
      { leaveDate: { $gte: qStart } }
    ]
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

  const QuarterlyTarget = require('../models/quarterly-target.model');
  const customTargetRecord = await QuarterlyTarget.findOne({
    employeeId: empId,
    quarterId
  });
  const baseQuarterlyTarget = customTargetRecord ? customTargetRecord.target : employee.target;

  const adjustedTarget = (baseQuarterlyTarget / 90) * actualWorkingDays;
  
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
      fullTarget: baseQuarterlyTarget,
      hasCustomTarget: !!customTargetRecord,
      actualWorkingDays: 0,
      adjustedTarget: 0,
      achievedSales: 0,
      achievedSalesValue: 0,
      achievedCommission: 0,
      clientsCount: 0,
      achievementPercentage: 0,
      gap: baseQuarterlyTarget,
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

  const targetToUse = adjustedTarget > 0 ? adjustedTarget : baseQuarterlyTarget;
  const achievementPercentage = targetToUse > 0 ? (achievedSalesValue / targetToUse) * 100 : 0;
  const gap = Math.max(0, targetToUse - achievedSalesValue);

  return {
    employeeId,
    employeeName: employee.name,
    code: employee.code,
    quarterId,
    fullTarget: baseQuarterlyTarget,
    hasCustomTarget: !!customTargetRecord,
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

  const oldTeamId = history.teamId ? history.teamId.toString() : null;

  if (data.joinDate) history.joinDate = new Date(data.joinDate);
  if (data.leaveDate !== undefined) {
    history.leaveDate = data.leaveDate ? new Date(data.leaveDate) : null;
  }
  if (data.teamId) {
    history.teamId = data.teamId;
  }

  const newTeamId = history.teamId ? history.teamId.toString() : null;
  const newLeaveDate = history.leaveDate;

  // Recalculate duration
  const end = history.leaveDate || new Date();
  history.workingDaysInTeam = calculateWorkingDays(history.joinDate, end);

  await history.save();

  // Sync with Employee and Team collections!
  const employeeId = history.employeeId;
  const employee = await Employee.findById(employeeId);

  if (employee) {
    // Case A: The history record was updated to be ACTIVE (leaveDate is now null)
    if (!newLeaveDate) {
      // 1. Close any OTHER active history records for this employee
      const otherActiveHistories = await EmployeeTeamHistory.find({ 
        employeeId, 
        _id: { $ne: historyId }, 
        leaveDate: null 
      });
      for (const ah of otherActiveHistories) {
        ah.leaveDate = history.joinDate;
        ah.workingDaysInTeam = calculateWorkingDays(ah.joinDate, history.joinDate);
        await ah.save();
        if (ah.teamId) {
          await Team.findByIdAndUpdate(ah.teamId, { $pull: { memberIds: employeeId } });
        }
      }

      // 2. Set employee's current team
      employee.currentTeamId = history.teamId || null;
      employee.teamJoinDate = history.joinDate;
      await employee.save();

      // 3. Update team memberships
      if (oldTeamId && oldTeamId !== newTeamId) {
        await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: employeeId } });
      }
      if (newTeamId) {
        await Team.findByIdAndUpdate(newTeamId, { $addToSet: { memberIds: employeeId } });
      }
    } 
    // Case B: The history record was updated to be INACTIVE (leaveDate is now NOT null)
    else {
      // If the employee's currentTeamId is currently pointing to this team, clear it!
      if (employee.currentTeamId?.toString() === oldTeamId || employee.currentTeamId?.toString() === newTeamId) {
        employee.currentTeamId = null;
        employee.teamJoinDate = null;
        await employee.save();
      }

      // Pull from the teams
      if (oldTeamId) {
        await Team.findByIdAndUpdate(oldTeamId, { $pull: { memberIds: employeeId } });
      }
      if (newTeamId) {
        await Team.findByIdAndUpdate(newTeamId, { $pull: { memberIds: employeeId } });
      }
    }
  }

  return history;
};

const addHistoryRecord = async (employeeId, { teamId, joinDate, leaveDate }) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const jDate = new Date(joinDate);
  const lDate = leaveDate ? new Date(leaveDate) : null;
  const quarterId = getQuarterId(jDate);

  // If this record is active (lDate is null):
  if (!lDate) {
    // 1. Close any existing active history records for this employee
    const activeHistories = await EmployeeTeamHistory.find({ employeeId, leaveDate: null });
    for (const ah of activeHistories) {
      ah.leaveDate = jDate;
      ah.workingDaysInTeam = calculateWorkingDays(ah.joinDate, jDate);
      await ah.save();
      if (ah.teamId) {
        await Team.findByIdAndUpdate(ah.teamId, { $pull: { memberIds: employeeId } });
      }
    }

    // 2. Set employee's current team
    employee.currentTeamId = teamId || null;
    employee.teamJoinDate = jDate;
    await employee.save();

    // 3. Add to team members
    if (teamId) {
      await Team.findByIdAndUpdate(teamId, { $addToSet: { memberIds: employeeId } });
    }
  } else {
    // If it has a leaveDate, we just create the history record.
    if (employee.currentTeamId?.toString() === teamId?.toString()) {
      employee.currentTeamId = null;
      employee.teamJoinDate = null;
      await employee.save();
      if (teamId) {
        await Team.findByIdAndUpdate(teamId, { $pull: { memberIds: employeeId } });
      }
    }
  }

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
