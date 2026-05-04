const employeeService = require('../services/employee.service');
const teamService = require('../services/team.service');
const Employee = require('../models/employee.model');
const Team = require('../models/team.model');
const { sendSuccess } = require('../utils/response.utils');

const getEmployeeTarget = async (req, res, next) => {
  try {
    const progress = await employeeService.getTargetProgress(req.params.id, req.query.quarterId);
    return sendSuccess(res, progress);
  } catch (error) {
    next(error);
  }
};

const getTeamTarget = async (req, res, next) => {
  try {
    const summary = await teamService.getTeamTargetSummary(req.params.id, req.query.quarterId);
    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

const getTargetSummary = async (req, res, next) => {
  try {
    const { quarterId } = req.query;
    if (!quarterId) {
      const err = new Error('quarterId is required');
      err.status = 400;
      throw err;
    }

    const salesEmployees = await Employee.find({ department: 'Sales', isActive: true }).populate('currentTeamId');
    
    const employeesData = [];
    let totalAdjustedTarget = 0;
    let totalAchieved = 0;

    for (const emp of salesEmployees) {
      try {
        const progress = await employeeService.getTargetProgress(emp._id, quarterId);
        employeesData.push({
          employeeId: emp._id,
          employeeName: emp.name,
          teamName: emp.currentTeamId ? emp.currentTeamId.name : null,
          adjustedTarget: progress.adjustedTarget,
          achievedSales: progress.achievedSalesValue,
          achievementPercentage: progress.achievementPercentage,
          gap: progress.gap
        });
        totalAdjustedTarget += progress.adjustedTarget;
        totalAchieved += progress.achievedSales;
      } catch (err) {
        // Handle case where employee target progress fails, usually means no target set
      }
    }

    const overallAchievementPercentage = totalAdjustedTarget > 0 ? (totalAchieved / totalAdjustedTarget) * 100 : 0;

    const summary = {
      quarterId,
      employees: employeesData,
      totals: {
        totalAdjustedTarget: Math.round(totalAdjustedTarget * 100) / 100,
        totalAchieved: Math.round(totalAchieved * 100) / 100,
        overallAchievementPercentage: Math.round(overallAchievementPercentage * 10) / 10
      }
    };

    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployeeTarget,
  getTeamTarget,
  getTargetSummary
};
