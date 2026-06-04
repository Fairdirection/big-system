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

    // Batch fetch leaf employee IDs and their aggregated sales in parallel
    const leafIds = await employeeService.getAllLeafEmployeeIds(quarterId);
    const progressMap = await employeeService.getTargetProgressBatch(leafIds, quarterId);

    // Batch fetch all quarterly target overrides for this quarter in one query
    const allQuarterlyTargets = await QuarterlyTarget.find({ quarterId }).lean();
    const quarterlyTargetMap = new Map(allQuarterlyTargets.map(t => [t.employeeId.toString(), t]));

    const leafIdSet = new Set(leafIds.map(id => id.toString()));

    const employeesData = [];
    let totalAdjustedTarget = 0;
    let totalAchieved = 0;

    // Process TL/SM employees in parallel — full recursive progress required for team rollups
    const complexEmployees = salesEmployees.filter(e => !leafIdSet.has(e._id.toString()));
    const complexResults = await Promise.all(
      complexEmployees.map(emp =>
        employeeService.getTargetProgress(emp._id, quarterId).catch(() => null)
      )
    );

    for (let i = 0; i < complexEmployees.length; i++) {
      const emp = complexEmployees[i];
      const progress = complexResults[i];
      if (!progress) continue;

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
        totalAchieved += progress.achievedSalesValue || 0;
      }
    }

    // Process leaf employees from progressMap — single batch query replaces N individual Sale queries
    const leafEmployees = salesEmployees.filter(e => leafIdSet.has(e._id.toString()));
    for (const emp of leafEmployees) {
      const empIdStr = emp._id.toString();
      const batchData = progressMap[empIdStr] || { totalRevenue: 0, dealCount: 0 };
      const customTargetRecord = quarterlyTargetMap.get(empIdStr);
      const fullTarget = customTargetRecord ? customTargetRecord.target : (emp.target || 0);
      const achievedSalesValue = batchData.totalRevenue || 0;
      const achievementPercentage = fullTarget > 0 ? (achievedSalesValue / fullTarget) * 100 : 0;
      const gap = Math.max(0, fullTarget - achievedSalesValue);

      employeesData.push({
        employeeId: emp._id,
        employeeName: emp.name,
        teamName: emp.currentTeamId ? emp.currentTeamId.name : null,
        fullTarget,
        hasCustomTarget: !!customTargetRecord,
        adjustedTarget: fullTarget,
        achievedSales: Math.round(achievedSalesValue),
        achievementPercentage: Math.round(achievementPercentage * 10) / 10,
        gap: Math.round(gap)
      });

      totalAdjustedTarget += fullTarget;
      totalAchieved += achievedSalesValue;
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
