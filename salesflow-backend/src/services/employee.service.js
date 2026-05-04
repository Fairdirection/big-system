const mongoose = require('mongoose');
const Employee = require('../models/employee.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const Team = require('../models/team.model');
const Sale = require('../models/sale.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId, getQuarterBounds, calculateEmployeeQuarterDays, calculateWorkingDays } = require('../utils/quarter.utils');
const { paginate } = require('../utils/pagination.utils');

const createEmployee = async (data) => {
  // 1. Generate code
  const code = await generateCode(Employee, 'code', 'EMP');

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
  return await EmployeeTeamHistory.find({ employeeId }).populate('teamId').sort({ joinDate: -1 });
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

const getTargetProgress = async (employeeId, quarterId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee || employee.department !== 'Sales') {
    throw new Error('Employee not found or not in Sales department');
  }

  // --- SPECIAL CASE: TEAM LEADER ---
  // If the employee is a TeamLeader, their progress is the TEAM'S progress
  if (employee.seniorityLevel === 'TeamLeader') {
    const team = await Team.findOne({ teamLeaderId: employeeId, isActive: true }).populate('memberIds');
    if (team) {
      const membersProgress = [];
      let totalAdjustedTarget = 0;
      let totalAchievedValue = 0;
      let totalAchievedCommission = 0;
      const totalUniqueClients = new Set();

      for (const member of team.memberIds) {
        // Reuse the same logic for each member
        const memberProgress = await getTargetProgress(member._id.toString(), quarterId);
        totalAdjustedTarget += Math.round(memberProgress.adjustedTarget);
        totalAchievedValue += Math.round(memberProgress.achievedSalesValue);
        totalAchievedCommission += Math.round(memberProgress.achievedCommission);
        membersProgress.push(memberProgress);
      }

      const achievementPercentage = totalAdjustedTarget > 0 ? (totalAchievedValue / totalAdjustedTarget) * 100 : 0;
      
      return {
        employeeId,
        employeeName: employee.name,
        code: employee.code,
        quarterId,
        isTeamLeader: true,
        fullTarget: totalAdjustedTarget, // For a leader, full target is the sum
        actualWorkingDays: 90, // Leaders are usually full quarter
        adjustedTarget: Math.round(totalAdjustedTarget),
        achievedSalesValue: Math.round(totalAchievedValue),
        achievedCommission: Math.round(totalAchievedCommission),
        achievementPercentage: Math.round(achievementPercentage * 10) / 10,
        gap: Math.round(Math.max(0, totalAdjustedTarget - totalAchievedValue)),
        teamMembersCount: team.memberIds.length
      };
    }
  }

  // --- NORMAL EMPLOYEE CASE ---
  // Ensure we use ObjectId for deep queries in Sale.find
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
  
  // Use a more robust query that handles both String and ObjectId formats
  const sales = await Sale.find({
    status: { $in: ['confirmed', 'claimed', 'collected'] },
    isActive: true,
    $and: [
      {
        $or: [
          { 'sellers.employeeId': employeeId },
          { 'sellers.employeeId': new mongoose.Types.ObjectId(employeeId) }
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

  const quarterSales = sales;

  let achievedSalesValue = 0;
  let achievedCommission = 0;
  const uniqueClients = new Set();

  quarterSales.forEach(sale => {
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
    gap: Math.round(gap)
  };
};

const getSalesDeptEmployees = async () => {
  return await Employee.find({ department: 'Sales', isActive: true }).select('name code');
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
  getSalesDeptEmployees
};
