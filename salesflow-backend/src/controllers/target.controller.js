const employeeService = require('../services/employee.service');
const teamService = require('../services/team.service');
const Employee = require('../models/employee.model');
const Team = require('../models/team.model');
const QuarterlyTarget = require('../models/quarterly-target.model');
const { clearDashboardCache } = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response.utils');

const getQuarterlyOverrides = async (req, res, next) => {
  try {
    const { quarterId } = req.query;
    if (!quarterId) {
      const err = new Error('quarterId is required');
      err.status = 400;
      throw err;
    }
    const overrides = await QuarterlyTarget.find({ quarterId }).lean();
    return sendSuccess(res, overrides);
  } catch (error) {
    next(error);
  }
};

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
          fullTarget: progress.fullTarget,
          hasCustomTarget: progress.hasCustomTarget || false,
          adjustedTarget: progress.adjustedTarget,
          achievedSales: progress.achievedSalesValue,
          achievementPercentage: progress.achievementPercentage,
          gap: progress.gap
        });
        
        // Sum personal targets and achievements to prevent double-counting team leaders, sales managers and members
        if ((progress.isTeamLeader || progress.isSalesManager) && progress.personalProgress) {
          totalAdjustedTarget += progress.personalProgress.adjustedTarget || 0;
          totalAchieved += progress.personalProgress.achievedSales || 0;
        } else {
          totalAdjustedTarget += progress.adjustedTarget || 0;
          totalAchieved += progress.achievedSales || 0;
        }
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
        totalAdjustedTargetEgp: Math.round(totalAdjustedTarget), // For convenient display if needed
        totalAchieved: Math.round(totalAchieved * 100) / 100,
        overallAchievementPercentage: Math.round(overallAchievementPercentage * 10) / 10
      }
    };

    return sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

const updateQuarterlyTarget = async (req, res, next) => {
  try {
    const { id: employeeId } = req.params;
    const { quarterId, target } = req.body;

    if (!quarterId) {
      const err = new Error('quarterId is required');
      err.status = 400;
      throw err;
    }

    const mongoose = require('mongoose');
    const empId = new mongoose.Types.ObjectId(employeeId);

    if (target === undefined || target === null) {
      await QuarterlyTarget.deleteOne({ employeeId: empId, quarterId });
    } else {
      const targetNum = Number(target);
      if (isNaN(targetNum) || targetNum < 0) {
        const err = new Error('target must be a positive number');
        err.status = 400;
        throw err;
      }

      await QuarterlyTarget.findOneAndUpdate(
        { employeeId: empId, quarterId },
        { target: targetNum },
        { upsert: true, new: true }
      );
    }

    clearDashboardCache();
    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuarterlyOverrides,
  getEmployeeTarget,
  getTeamTarget,
  getTargetSummary,
  updateQuarterlyTarget
};
