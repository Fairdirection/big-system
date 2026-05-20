const mongoose = require('mongoose');
const Employee = require('../models/employee.model');
const Sale = require('../models/sale.model');
const QuarterlyTarget = require('../models/quarterly-target.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const Team = require('../models/team.model');
const CommissionPayout = require('../models/commission-payout.model');
const QuarterlySettlement = require('../models/quarterly-settlement.model');

const { to30Day, getQuarterBounds, getQuarterId, calculateWorkingDays, calculateEmployeeQuarterDays } = require('../utils/quarter.utils');

const COMMISSION_RULES = {
  'Fresh': {
    target: 21000000,
    companyRate: 4500,
    personalSlabs: [
      { maxRate: 2.9, ratePerMillion: 4500 },
      { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
      { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
      { minRate: 4.5, ratePerMillion: 10000 }
    ]
  },
  'BA': { // Property Advisor
    target: 27000000,
    companyTiers: [
      { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
      { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5000 },
      { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 5500 },
      { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 6000 },
      { minAchievement: 150.0001, ratePerMillion: 6500 }
    ],
    personalSlabs: [
      { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
      { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
      { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
      { minRate: 4.5, ratePerMillion: 10000 }
    ]
  },
  'BC': { // Property Consultant
    target: 30000000,
    companyTiers: [
      { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
      { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5000 },
      { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 6000 },
      { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 6500 },
      { minAchievement: 150.0001, ratePerMillion: 7000 }
    ],
    personalSlabs: [
      { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
      { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
      { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
      { minRate: 4.5, ratePerMillion: 10000 }
    ]
  },
  'Senior': {
    target: 36000000,
    companyTiers: [
      { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
      { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5500 },
      { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 6500 },
      { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 7000 },
      { minAchievement: 150.0001, ratePerMillion: 7500 }
    ],
    personalSlabs: [
      { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
      { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
      { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
      { minRate: 4.5, ratePerMillion: 10000 }
    ]
  },
  'SV': { // Supervisor
    target: 42000000,
    companyTiers: [
      { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
      { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5500 },
      { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 7000 },
      { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 7500 },
      { minAchievement: 150.0001, ratePerMillion: 8000 }
    ],
    personalSlabs: [
      { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
      { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
      { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
      { minRate: 4.5, ratePerMillion: 10000 }
    ]
  },
  'TeamLeader': {
    companyTiers: [
      { minAchievement: 0, maxAchievement: 50, ratePerMillion: 1800 },
      { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 2000 },
      { minAchievement: 75.0001, maxAchievement: 120, ratePerMillion: 2200 },
      { minAchievement: 120.0001, maxAchievement: 150, ratePerMillion: 2400 },
      { minAchievement: 150.0001, ratePerMillion: 2600 }
    ],
    personalSlabs: [
      { maxRate: 2.9, ratePerMillion: 1500 },
      { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
      { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
      { minRate: 4.5, ratePerMillion: 10000 }
    ]
  }
};

/**
 * Classifies sale source by developer rate
 */
const classifySaleSource = (developerCommissionRate) => {
  return (developerCommissionRate <= 2.9) ? 'Company' : 'Personal';
};

/**
 * Calculates scheduled payout cycle and date
 */
const getPayoutCycleDetails = (collectedDate) => {
  const date = new Date(collectedDate);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day >= 5 && day <= 15) {
    // Cycle A: Paid on 20th of the same month
    const payoutDate = new Date(year, month, 20);
    return {
      payoutCycle: 'Cycle A',
      payoutDate
    };
  } else {
    // Cycle B: Paid on 10th of next month (if day > 15) or current month (if day < 5)
    let payoutDate;
    if (day > 15) {
      payoutDate = new Date(year, month + 1, 10);
    } else {
      payoutDate = new Date(year, month, 10);
    }
    return {
      payoutCycle: 'Cycle B',
      payoutDate
    };
  }
};

/**
 * Splits developer incentive between salesperson and manager
 */
const splitIncentive = (incentivePercentage, unitValue) => {
  if (!incentivePercentage || incentivePercentage <= 0) {
    return { salespersonIncentive: 0, managerIncentive: 0 };
  }

  const totalIncentiveAmount = (incentivePercentage / 100) * unitValue;
  
  if (incentivePercentage < 1.5) {
    // 100% to salesperson
    return {
      salespersonIncentive: Math.round(totalIncentiveAmount),
      managerIncentive: 0
    };
  } else if (incentivePercentage >= 1.5 && incentivePercentage < 3.0) {
    // 0.5% of unit value to manager, rest to salesperson
    const managerIncentive = (0.5 / 100) * unitValue;
    const salespersonIncentive = totalIncentiveAmount - managerIncentive;
    return {
      salespersonIncentive: Math.round(salespersonIncentive),
      managerIncentive: Math.round(managerIncentive)
    };
  } else {
    // 1.0% of unit value to manager, rest to salesperson
    const managerIncentive = (1.0 / 100) * unitValue;
    const salespersonIncentive = totalIncentiveAmount - managerIncentive;
    return {
      salespersonIncentive: Math.round(salespersonIncentive),
      managerIncentive: Math.round(managerIncentive)
    };
  }
};

/**
 * Gets the rate per million for a personal sale based on developer rate
 */
const getPersonalRate = (seniorityLevel, devRate, activeRules = COMMISSION_RULES) => {
  const rules = activeRules[seniorityLevel];
  if (!rules) return 4500;
  
  for (const slab of rules.personalSlabs) {
    const minOk = slab.minRate === undefined || devRate >= slab.minRate;
    const maxOk = slab.maxRate === undefined || devRate <= slab.maxRate;
    if (minOk && maxOk) {
      return slab.ratePerMillion;
    }
  }
  return 4500;
};

/**
 * Helper to determine the company rate per million based on achievement percentage
 */
const getCompanyRateForAchievement = (seniorityLevel, achievementPct, activeRules = COMMISSION_RULES) => {
  const rules = activeRules[seniorityLevel];
  if (!rules) return 4500;
  
  if (seniorityLevel === 'Fresh') {
    return rules.companyRate;
  }
  
  for (const tier of rules.companyTiers) {
    const minOk = tier.minAchievement === undefined || achievementPct >= tier.minAchievement;
    const maxOk = tier.maxAchievement === undefined || achievementPct <= tier.maxAchievement;
    if (minOk && maxOk) {
      return tier.ratePerMillion;
    }
  }
  
  // Return last tier rate as fallback
  const lastTier = rules.companyTiers[rules.companyTiers.length - 1];
  return lastTier ? lastTier.ratePerMillion : 4500;
};

/**
 * Gets the next tier rate above the achieved one (for referrals)
 */
const getReferralRate = (seniorityLevel, achievementPct, activeRules = COMMISSION_RULES) => {
  const rules = activeRules[seniorityLevel];
  if (!rules || seniorityLevel === 'Fresh') return 4500;
  
  const companyTiers = rules.companyTiers;
  
  // Find current tier index
  let currentIdx = 0;
  for (let i = 0; i < companyTiers.length; i++) {
    const tier = companyTiers[i];
    const minOk = tier.minAchievement === undefined || achievementPct >= tier.minAchievement;
    const maxOk = tier.maxAchievement === undefined || achievementPct <= tier.maxAchievement;
    if (minOk && maxOk) {
      currentIdx = i;
      break;
    }
  }

  // Cap at the tier that contains 100% achievement (rule: referral pays next tier, max = 100% tier)
  const hundredPctIdx = companyTiers.findIndex(tier => {
    const minOk = tier.minAchievement === undefined || 100 >= tier.minAchievement;
    const maxOk = tier.maxAchievement === undefined || 100 <= tier.maxAchievement;
    return minOk && maxOk;
  });
  const capIdx = hundredPctIdx >= 0 ? hundredPctIdx : companyTiers.length - 1;
  const nextIdx = Math.min(currentIdx + 1, capIdx);
  return companyTiers[nextIdx].ratePerMillion;
};

/**
 * Main Calculator Service: computes target progress and all allowance streams
 */
const calculateEmployeeQuarterCommissions = async (employeeId, quarterId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee || employee.department !== 'Sales') {
    throw new Error('Employee not found or not in Sales department');
  }

  const Setting = require('../models/setting.model');
  const customRulesRecord = await Setting.findOne({ type: 'commissionRules', isActive: true }).lean();
  let activeRules = COMMISSION_RULES;
  if (customRulesRecord && customRulesRecord.value) {
    try {
      activeRules = JSON.parse(customRulesRecord.value);
    } catch (e) {
      console.error('Failed to parse custom commission rules:', e);
    }
  }

  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);
  const seniority = employee.seniorityLevel || 'Fresh';
  const rules = activeRules[seniority] || activeRules['Fresh'];

  // 1. Calculate Target (Adjusted for Working Days)
  let baseQuarterlyTarget = employee.target || rules.target || 21000000;
  
  // If Team Leader: target is sum of members' targets
  const isTL = seniority === 'TeamLeader';
  let teamMembers = [];
  let membersProgress = [];
  
  if (isTL) {
    const team = await Team.findOne({ teamLeaderId: employeeId, isActive: true }).populate('memberIds');
    teamMembers = team ? team.memberIds.filter(m => m._id.toString() !== employeeId && m.isActive) : [];
    
    let totalTeamTarget = 0;
    for (const m of teamMembers) {
      const mProg = await calculateEmployeeQuarterCommissions(m._id.toString(), quarterId);
      totalTeamTarget += mProg.adjustedTarget;
      membersProgress.push(mProg);
    }
    baseQuarterlyTarget = totalTeamTarget;
  } else {
    // Check if custom target exists
    const customTargetRecord = await QuarterlyTarget.findOne({ employeeId, quarterId });
    if (customTargetRecord) {
      baseQuarterlyTarget = customTargetRecord.target;
    }
  }

  // Calculate working days in quarter
  let actualWorkingDays = 0;
  const intervals = [];

  const histories = await EmployeeTeamHistory.find({
    employeeId,
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
      joinDateObj.setHours(0, 0, 0, 0);
      const start = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

      const leaveDate = h.leaveDate ? new Date(h.leaveDate) : (employee.isActive ? qEnd : (employee.endDate || new Date()));
      const leaveDateObj = new Date(leaveDate);
      leaveDateObj.setHours(23, 59, 59, 999);
      const end = new Date(Math.min(qEnd.getTime(), leaveDateObj.getTime()));

      if (end >= start) {
        intervals.push({ start, end });
      }
    }
  } else {
    const joinDate = employee.hireDate || employee.createdAt;
    // Normalize to 30-day convention before timestamp comparisons
    const joinDateObj = to30Day(joinDate);
    joinDateObj.setHours(0, 0, 0, 0);
    const start = new Date(Math.max(qStart.getTime(), joinDateObj.getTime()));

    const rawEnd = employee.isActive ? qEnd : (employee.endDate || new Date());
    const endDateObj = to30Day(rawEnd);
    endDateObj.setHours(23, 59, 59, 999);
    const end = new Date(Math.min(qEnd.getTime(), endDateObj.getTime()));

    if (end >= start) {
      actualWorkingDays = calculateWorkingDays(start, end);
      intervals.push({ start, end });
    }
  }

  // Adjust target
  const adjustedTarget = isTL ? baseQuarterlyTarget : Math.round((baseQuarterlyTarget / 90) * actualWorkingDays);
  const targetToUse = adjustedTarget > 0 ? adjustedTarget : baseQuarterlyTarget;

  // 2. Fetch all sales for employee or team in the quarter
  let salesQuery = {
    status: { $in: ['confirmed', 'claimed', 'collected'] },
    isActive: true,
    $and: []
  };

  if (isTL && teamMembers.length > 0) {
    // TL gets team members' sales + their own sales
    const allIds = teamMembers.map(m => m._id.toString()).concat([employeeId]);
    salesQuery.$and.push({
      'sellers.employeeId': { $in: allIds }
    });
  } else {
    salesQuery.$and.push({
      'sellers.employeeId': employeeId
    });
  }

  if (intervals.length > 0) {
    salesQuery.$and.push({
      $or: intervals.map(interval => ({
        contractDate: { $gte: interval.start, $lte: interval.end }
      }))
    });
  } else {
    // Fallback: contractDate in quarter bounds
    salesQuery.$and.push({
      contractDate: { $gte: qStart, $lte: qEnd }
    });
  }

  const sales = await Sale.find(salesQuery).lean();

  // 3. Process each sale and calculate allowance contributions
  let achievedSalesValueForTarget = 0; // factoring in 1/3 rule
  let achievedSalesValueRaw = 0;      // raw unit value
  let totalCommissionsPaidMonthly = 0; // monthly minimum tier sum
  let totalCommissionsEarnedFinal = 0; // final correct tier sum
  
  const processedSales = sales.map(sale => {
    // Find employee share
    const seller = sale.sellers.find(s => s.employeeId.toString() === employeeId);
    
    // Check if this is a team member sale (only relevant for TL team calculation)
    const isTeamMemberSale = !seller && isTL;
    
    // Calculate employee's share percentages and values
    const sharePercentage = seller ? seller.sharePercentage : 0;
    const sellerSaleValueRaw = (sharePercentage / 100) * sale.unitValue;
    
    // 1/3 Target rule for developer rate <= 1.9%
    const isOneThirdRule = sale.contractCommissionPercentage <= 1.9;
    const targetContributionRatio = isOneThirdRule ? (1/3) : 1;
    const sellerSaleValueForTarget = sellerSaleValueRaw * targetContributionRatio;

    if (seller) {
      achievedSalesValueRaw += sellerSaleValueRaw;
      achievedSalesValueForTarget += sellerSaleValueForTarget;
    } else if (isTeamMemberSale) {
      // Find team member's share value for TL target tracking
      const memberSeller = sale.sellers.find(s => teamMembers.some(m => m._id.toString() === s.employeeId.toString()));
      if (memberSeller) {
        const memberShare = memberSeller.sharePercentage;
        achievedSalesValueForTarget += (memberShare / 100) * sale.unitValue * targetContributionRatio;
      }
    }

    return {
      saleId: sale._id,
      saleNumber: sale.saleNumber,
      projectName: sale.projectName,
      clientName: sale.clientName || null,
      unitNumber: sale.unitNumber,
      unitValue: sale.unitValue,
      contractDate: sale.contractDate,
      developerCommissionRate: sale.contractCommissionPercentage,
      status: sale.status,
      sharePercentage,
      sellerSaleValueRaw,
      sellerSaleValueForTarget,
      isOneThirdRule,
      isPrivateSource: sale.isPrivateSource || false,
      seller,
      incentivePercentage: sale.incentivePercentage || 0
    };
  });

  // Calculate achievement percentage
  const achievementPercentage = targetToUse > 0 ? (achievedSalesValueForTarget / targetToUse) * 100 : 0;
  
  // Calculate company rate per million based on achievement
  const companyRatePerMillion = getCompanyRateForAchievement(seniority, achievementPercentage, activeRules);
  const minTierRatePerMillion = isTL ? 1800 : 4500; // minimum (first) tier rate EGP/M

  // Recalculate each sale's allowance payout (monthly minimum vs final quarter earned)
  const finalPayoutsList = [];

  for (const pSale of processedSales) {
    if (!pSale.seller) continue; // skip sales where employee was not a seller (only team members)

    const devRate = pSale.developerCommissionRate;
    const isPersonal = devRate >= 3.0;
    const isReferral = pSale.isPrivateSource || false;
    
    // Calculate Monthly Payout (Minimum Tier)
    let monthlyRate = minTierRatePerMillion;
    let finalRate = companyRatePerMillion;
    
    if (seniority === 'Fresh') {
      if (isPersonal) {
        monthlyRate = getPersonalRate(seniority, devRate, activeRules);
        finalRate = monthlyRate;
      } else {
        monthlyRate = rules.companyRate;
        finalRate = monthlyRate;
      }
    } else if (isTL) {
      // TL Rules
      if (devRate < 3.0) {
        // Flat 1,500/M regardless of team achievement
        monthlyRate = 1500;
        finalRate = 1500;
      } else {
        // Standard personal slabs
        monthlyRate = getPersonalRate(seniority, devRate, activeRules);
        finalRate = monthlyRate;
      }
    } else {
      // BA, BC, Senior, SV Rules
      if (isPersonal) {
        // Personal Slabs
        monthlyRate = getPersonalRate(seniority, devRate, activeRules);
        finalRate = monthlyRate;
      } else {
        // Company Sale
        monthlyRate = minTierRatePerMillion;
        
        // Developer rate 2.0% - 2.9% pays minimum tier ONLY
        if (devRate >= 2.0 && devRate <= 2.9) {
          finalRate = minTierRatePerMillion;
        } else if (isReferral) {
          // Referral Sale -> next tier above achieved (capped at 100%)
          finalRate = getReferralRate(seniority, achievementPercentage, activeRules);
        } else {
          finalRate = companyRatePerMillion;
        }
      }
    }

    // Apply 1/3 rule multiplier for developer rate <= 1.9%
    const rateMultiplier = pSale.isOneThirdRule ? (1/3) : 1;
    
    const monthlyPayoutRaw = (pSale.sellerSaleValueRaw / 1000000) * monthlyRate * rateMultiplier;
    const finalPayoutRaw = (pSale.sellerSaleValueRaw / 1000000) * finalRate * rateMultiplier;

    const monthlyPayout = Math.round(monthlyPayoutRaw);
    const finalPayout = Math.round(finalPayoutRaw);

    // Calculate Incentives
    const { salespersonIncentive, managerIncentive } = splitIncentive(pSale.incentivePercentage, pSale.sellerSaleValueRaw);

    totalCommissionsPaidMonthly += monthlyPayout;
    totalCommissionsEarnedFinal += finalPayout;

    finalPayoutsList.push({
      ...pSale,
      monthlyRate,
      finalRate,
      monthlyPayout,
      finalPayout,
      salespersonIncentive,
      managerIncentive,
      settlementDelta: finalPayout - monthlyPayout
    });
  }

  const gap = Math.max(0, targetToUse - achievedSalesValueForTarget);

  return {
    employeeId,
    employeeName: employee.name,
    code: employee.code,
    seniorityLevel: seniority,
    quarterId,
    fullTarget: baseQuarterlyTarget,
    actualWorkingDays,
    adjustedTarget: Math.round(adjustedTarget),
    achievedSalesRaw: Math.round(achievedSalesValueRaw),
    achievedSalesValue: Math.round(achievedSalesValueForTarget), // formatted EGP factoring 1/3
    achievementPercentage: Math.round(achievementPercentage * 10) / 10,
    gap: Math.round(gap),
    companyRatePerMillion,
    minTierRatePerMillion,
    totalCommissionsPaidMonthly,
    totalCommissionsEarnedFinal,
    settlementDifference: totalCommissionsEarnedFinal - totalCommissionsPaidMonthly,
    sales: finalPayoutsList,
    membersProgress: isTL ? membersProgress : undefined
  };
};

/**
 * Commits a payout to the database (called when sale is confirmed/collected)
 */
const recordSaleCommissionPayouts = async (saleId) => {
  const sale = await Sale.findById(saleId).populate('sellers.employeeId');
  if (!sale || !sale.isActive) return;

  // We only generate payout records when developer commission is 'collected'
  if (sale.status !== 'collected') return;

  const collectedDate = sale.updatedAt || new Date();
  const { payoutCycle, payoutDate } = getPayoutCycleDetails(collectedDate);
  const quarterId = sale.quarterId || getQuarterId(collectedDate);

  const results = [];
  for (const seller of sale.sellers) {
    const employee = seller.employeeId;
    if (!employee || employee.department !== 'Sales') continue;

    // Check if payout already recorded for this sale and employee
    const existing = await CommissionPayout.findOne({ saleId, employeeId: employee._id, deletedAt: null });
    if (existing) continue;

    // To compute the correct minimum payout, we get the current quarter progress
    const progress = await calculateEmployeeQuarterCommissions(employee._id.toString(), quarterId);
    
    // Find the calculated monthly payout for this sale
    const saleProgress = progress.sales.find(s => s.saleId.toString() === saleId.toString());
    if (!saleProgress) continue;

    const payoutRecord = await CommissionPayout.create({
      employeeId: employee._id,
      saleId,
      saleNumber: sale.saleNumber,
      unitValue: sale.unitValue,
      sharePercentage: seller.sharePercentage,
      sellerSaleValue: saleProgress.sellerSaleValueRaw,
      
      developerCommissionRate: sale.contractCommissionPercentage,
      saleSource: classifySaleSource(sale.contractCommissionPercentage),
      seniorityLevel: employee.seniorityLevel || 'Fresh',
      
      baseCommissionRate: saleProgress.monthlyRate,
      grossAmount: saleProgress.monthlyPayout,
      isMinimumTier: true,
      
      incentivePercentage: sale.incentivePercentage || 0,
      incentiveAmount: saleProgress.salespersonIncentive || 0,
      managerIncentiveShare: saleProgress.managerIncentive || 0,
      
      collectedAt: collectedDate,
      payoutDate,
      payoutCycle,
      quarterId,
      status: 'pending',
      notes: `Project: ${sale.projectName}, Unit: ${sale.unitNumber}`
    });

    results.push(payoutRecord);
  }

  return results;
};

/**
 * Runs the end-of-quarter settlement engine for a single salesperson
 */
const runQuarterlySettlement = async (employeeId, quarterId) => {
  const progress = await calculateEmployeeQuarterCommissions(employeeId, quarterId);
  
  // Fetch all payouts already recorded for this employee and quarter
  const paidRecords = await CommissionPayout.find({ employeeId, quarterId, deletedAt: null });
  const totalPaidMinimums = paidRecords.reduce((sum, p) => sum + p.grossAmount, 0);

  const settlementDiff = progress.totalCommissionsEarnedFinal - totalPaidMinimums;

  const settlement = await QuarterlySettlement.findOneAndUpdate(
    { employeeId, quarterId },
    {
      seniorityLevel: progress.seniorityLevel,
      quarterlyTarget: progress.adjustedTarget,
      actualWorkingDays: progress.actualWorkingDays,
      achievedSalesValue: progress.achievedSalesValue,
      achievementPercentage: progress.achievementPercentage,
      finalTierRate: progress.companyRatePerMillion,
      
      totalEarnedCommission: progress.totalCommissionsEarnedFinal,
      totalPaidMinimums,
      settlementDifference: settlementDiff,
      status: 'draft',
      notes: `Quarter end reconciliation. Total Earned: EGP ${progress.totalCommissionsEarnedFinal}, Paid so far: EGP ${totalPaidMinimums}`
    },
    { new: true, upsert: true }
  );

  return settlement;
};

/**
 * Simulates a commission calculation (dry-run)
 */
const simulateCommission = (role, salesAmount, developerRate, saleSource, quarterTotal, activeRules = COMMISSION_RULES) => {
  const rules = activeRules[role] || activeRules['Fresh'];
  const target = rules.target || 21000000;

  const isOneThirdRule = developerRate <= 1.9;
  const targetMultiplier = isOneThirdRule ? (1/3) : 1;
  const simulatedTargetContribution = salesAmount * targetMultiplier;

  const projectedQuarterTotal = (quarterTotal || 0) + simulatedTargetContribution;
  const achievementPct = target > 0 ? (projectedQuarterTotal / target) * 100 : 0;

  const isPersonal = developerRate >= 3.0;
  const isTL = role === 'TeamLeader';
  let ratePerMillion = getCompanyRateForAchievement(role, achievementPct, activeRules);

  if (role === 'Fresh') {
    ratePerMillion = isPersonal ? getPersonalRate(role, developerRate, activeRules) : (rules.companyRate || 4500);
  } else if (isTL) {
    ratePerMillion = developerRate < 3.0 ? 1500 : getPersonalRate(role, developerRate, activeRules);
  } else {
    if (isPersonal) {
      ratePerMillion = getPersonalRate(role, developerRate, activeRules);
    } else {
      ratePerMillion = (developerRate >= 2.0 && developerRate <= 2.9)
        ? 4500
        : getCompanyRateForAchievement(role, achievementPct, activeRules);
    }
  }

  // Monthly minimum rate (first tier / fixed rate — paid immediately without waiting for quarter end)
  let monthlyTierRate;
  if (role === 'Fresh') {
    monthlyTierRate = rules.companyRate || 4500;
  } else if (isTL) {
    monthlyTierRate = developerRate < 3.0 ? 1500 : getPersonalRate(role, developerRate, activeRules);
  } else if (isPersonal) {
    monthlyTierRate = getPersonalRate(role, developerRate, activeRules);
  } else {
    monthlyTierRate = 4500; // minimum company tier
  }

  const commissionEarnedRaw = (salesAmount / 1000000) * ratePerMillion * targetMultiplier;
  const monthlyPayoutMinRaw = (salesAmount / 1000000) * monthlyTierRate * targetMultiplier;
  const commissionEarned = Math.round(commissionEarnedRaw);
  const monthlyPayoutMin = Math.round(monthlyPayoutMinRaw);

  return {
    role,
    salesAmount,
    developerRate,
    saleSource,
    isOneThirdRule,
    isOneThirdApplied: isOneThirdRule,
    isCompanySale: !isPersonal,
    targetContribution: Math.round(simulatedTargetContribution),
    ratePerMillion,
    commissionEarned,
    monthlyPayoutMin,
    estimatedFinalQuarterlyPayout: commissionEarned,
    split: {
      salespersonAmount: commissionEarned,
      managerAmount: 0
    },
    projectedQuarterTotal: Math.round(projectedQuarterTotal),
    projectedAchievementPercentage: Math.round(achievementPct * 10) / 10
  };
};

module.exports = {
  calculateEmployeeQuarterCommissions,
  recordSaleCommissionPayouts,
  runQuarterlySettlement,
  simulateCommission,
  classifySaleSource,
  getPayoutCycleDetails,
  splitIncentive
};
