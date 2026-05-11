const Sale = require('../models/sale.model');
const Employee = require('../models/employee.model');
const Claim = require('../models/claim.model');
const Team = require('../models/team.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const employeeService = require('./employee.service');
const { getQuarterBounds, calculateEmployeeQuarterDays, calculateWorkingDays } = require('../utils/quarter.utils');

const dashboardCache = new Map();

const clearDashboardCache = () => {
  dashboardCache.clear();
};

const getDashboardStats = async (quarterId) => {
  if (dashboardCache.has(quarterId)) {
    return dashboardCache.get(quarterId);
  }

  const { start, end } = getQuarterBounds(quarterId);

  const matchQuery = {
    isActive: true,
    status: { $ne: 'draft' },
    $or: [
      { quarterId },
      { contractDate: { $gte: start, $lte: end } }
    ]
  };

  // 1. Total Sales vs Collected (Efficient Aggregations)
  const [salesStats, collectionStats, statusDist, allSalesForQuarter] = await Promise.all([
    Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossCommissionWithVAT' },
          totalNet: { $sum: '$netRevenue' },
          totalVolume: { $sum: '$unitValue' },
          count: { $sum: 1 }
        }
      }
    ]),
    Claim.aggregate([
      { $match: { isActive: true, status: 'collected' } },
      {
        $lookup: {
          from: 'sales',
          localField: 'saleId',
          foreignField: '_id',
          as: 'saleInfo'
        }
      },
      { $unwind: '$saleInfo' },
      {
        $match: {
          $or: [
            { 'saleInfo.quarterId': quarterId },
            { 'saleInfo.contractDate': { $gte: start, $lte: end } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          collectedGross: { $sum: '$saleInfo.grossCommissionWithVAT' },
          count: { $sum: 1 }
        }
      }
    ]),
    Sale.aggregate([
      { $match: { 
        isActive: true,
        $or: [
          { quarterId },
          { contractDate: { $gte: start, $lte: end } }
        ]
      } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Sale.find(matchQuery).lean()
  ]);

  // 2. Target vs Achieved (Optimized Bulk Calculation)
  const [salesEmployees, teams] = await Promise.all([
    Employee.find({ department: 'Sales', isActive: true }),
    Team.find({ isActive: true }).lean()
  ]);
  
  // Fetch all history for all sales employees in this quarter once
  const allHistory = await EmployeeTeamHistory.find({ 
    employeeId: { $in: salesEmployees.map(e => e._id) }
  }).lean();

  let totalTargets = 0;
  const historyByEmployee = allHistory.reduce((acc, h) => {
    const id = h.employeeId.toString();
    if (!acc[id]) acc[id] = [];
    acc[id].push(h);
    return acc;
  }, {});

  for (const emp of salesEmployees) {
    const empIdStr = emp._id.toString();
    const history = historyByEmployee[empIdStr] || [];
    
    // Use the logic from getTargetProgress but with pre-fetched data
    let actualWorkingDays = calculateEmployeeQuarterDays(history, quarterId);
    
    // Fallback if no history
    if (actualWorkingDays === 0 && emp.currentTeamId) {
      const joinDate = emp.teamJoinDate || emp.createdAt;
      const effectiveStart = new Date(Math.max(start, new Date(joinDate)));
      const effectiveEnd = new Date(Math.min(end, new Date()));
      if (effectiveEnd > effectiveStart) {
        actualWorkingDays = calculateWorkingDays(effectiveStart, effectiveEnd);
      }
    }

    const isTL = emp.seniorityLevel === 'TeamLeader';
    const isSM = emp.seniorityLevel === 'SalesManager';

    let hasTeam = false;
    if (isTL) {
      const team = teams.find(t => t.teamLeaderId && t.teamLeaderId.toString() === empIdStr);
      const teamMembers = team ? (team.memberIds || []).filter(m => m && m.toString() !== empIdStr) : [];
      hasTeam = team && teamMembers.length > 0;
    } else if (isSM) {
      const reports = salesEmployees.filter(e => e.managerId && e.managerId.toString() === empIdStr && e.seniorityLevel === 'TeamLeader');
      hasTeam = reports.some(leader => {
        const leaderTeam = teams.find(t => t.teamLeaderId && t.teamLeaderId.toString() === leader._id.toString());
        const leaderTeamMembers = leaderTeam ? (leaderTeam.memberIds || []).filter(m => m && m.toString() !== leader._id.toString()) : [];
        return leaderTeam && leaderTeamMembers.length > 0;
      });
    }

    if (!hasTeam) {
      const adjustedTarget = (emp.target / 90) * actualWorkingDays;
      totalTargets += adjustedTarget || 0;
    }
  }

  // 3. Team Ranking (Optimized single aggregation)
  // Calculate revenue per team in memory using allSalesForQuarter
  const teamRevenueMap = {};
  const teamSalesCountMap = {};

  const getTeamForEmployeeOnDate = (empIdStr, contractDate, empObj) => {
    const saleDate = new Date(contractDate);
    const history = historyByEmployee[empIdStr] || [];

    // Find the history record that covers this contractDate
    const match = history.find(h => {
      const join = new Date(h.joinDate);
      join.setHours(0, 0, 0, 0);
      const leave = h.leaveDate ? new Date(h.leaveDate) : null;
      if (leave) {
        leave.setHours(23, 59, 59, 999);
      }
      return saleDate >= join && (!leave || saleDate <= leave);
    });

    if (match) return match.teamId ? match.teamId.toString() : null;

    // Fallback if no history matches (legacy or fallback data)
    if (empObj && empObj.currentTeamId) {
      const joinDate = empObj.teamJoinDate || empObj.createdAt || new Date();
      const join = new Date(joinDate);
      join.setHours(0, 0, 0, 0);
      if (saleDate >= join) {
        return empObj.currentTeamId.toString();
      }
    }

    return null;
  };

  allSalesForQuarter.forEach(sale => {
    const saleId = sale._id.toString();
    const uniqueTeamsForThisSale = new Set();

    sale.sellers.forEach(seller => {
      const empId = seller.employeeId.toString();
      const empObj = salesEmployees.find(e => e._id.toString() === empId);
      
      // Find which team this employee belonged to on the contractDate of the sale
      const teamIdStr = getTeamForEmployeeOnDate(empId, sale.contractDate, empObj);
      if (teamIdStr) {
        teamRevenueMap[teamIdStr] = (teamRevenueMap[teamIdStr] || 0) + (seller.commissionValue || 0);
        uniqueTeamsForThisSale.add(teamIdStr);
      }
    });

    uniqueTeamsForThisSale.forEach(teamId => {
      teamSalesCountMap[teamId] = (teamSalesCountMap[teamId] || 0) + 1;
    });
  });

  const teamRanking = teams.map(team => {
    const tid = team._id.toString();
    const membersPerformance = [];

    // Calculate individual performance for each member of this team
    (team.memberIds || []).forEach(memberId => {
      const mIdStr = memberId.toString();
      const emp = salesEmployees.find(e => e._id.toString() === mIdStr);
      if (!emp) return;

      const history = historyByEmployee[mIdStr] || [];
      const workingDays = calculateEmployeeQuarterDays(history, quarterId);

      const isTL = emp.seniorityLevel === 'TeamLeader';
      const isSM = emp.seniorityLevel === 'SalesManager';

      let hasTeam = false;
      if (isTL) {
        const leaderTeam = teams.find(t => t.teamLeaderId && t.teamLeaderId.toString() === mIdStr);
        const leaderTeamMembers = leaderTeam ? (leaderTeam.memberIds || []).filter(m => m && m.toString() !== mIdStr) : [];
        hasTeam = leaderTeam && leaderTeamMembers.length > 0;
      } else if (isSM) {
        const reports = salesEmployees.filter(e => e.managerId && e.managerId.toString() === mIdStr && e.seniorityLevel === 'TeamLeader');
        hasTeam = reports.some(leader => {
          const leaderTeam = teams.find(t => t.teamLeaderId && t.teamLeaderId.toString() === leader._id.toString());
          const leaderTeamMembers = leaderTeam ? (leaderTeam.memberIds || []).filter(m => m && m.toString() !== leader._id.toString()) : [];
          return leaderTeam && leaderTeamMembers.length > 0;
        });
      }

      let adjustedTarget = 0;
      if (!hasTeam) {
        adjustedTarget = (emp.target / 90) * workingDays;
      }

      let memberAchieved = 0;
      allSalesForQuarter.forEach(sale => {
        const seller = (sale.sellers || []).find(s => s.employeeId.toString() === mIdStr);
        if (seller) {
          const saleTeamId = getTeamForEmployeeOnDate(mIdStr, sale.contractDate, emp);
          if (saleTeamId && saleTeamId === tid) {
            memberAchieved += (sale.unitValue || 0);
          }
        }
      });

      membersPerformance.push({
        employeeId: mIdStr,
        name: emp.name,
        adjustedTarget: Math.round(adjustedTarget),
        achieved: Math.round(memberAchieved),
        achievementPercentage: adjustedTarget > 0 ? Math.round((memberAchieved / adjustedTarget) * 1000) / 10 : 0
      });
    });

    return {
      teamId: team._id,
      teamName: team.name,
      achieved: teamRevenueMap[tid] || 0,
      salesCount: teamSalesCountMap[tid] || 0,
      membersPerformance
    };
  }).sort((a, b) => b.achieved - a.achieved);

  // 4. Client Count (Optimized)
  const totalClients = new Set(allSalesForQuarter.map(s => s.clientId?.toString()).filter(Boolean)).size;

  const result = {
    overview: {
      totalGross: salesStats.length > 0 ? salesStats[0].totalGross : 0,
      totalNet: salesStats.length > 0 ? salesStats[0].totalNet : 0,
      totalVolume: salesStats.length > 0 ? salesStats[0].totalVolume : 0,
      collectedGross: collectionStats.length > 0 ? collectionStats[0].collectedGross : 0,
      salesCount: salesStats.length > 0 ? salesStats[0].count : 0,
      collectedCount: collectionStats.length > 0 ? collectionStats[0].count : 0
    },
    targets: {
      totalQuarterlyTargets: Math.round(totalTargets),
      achievedPercentage: totalTargets > 0 ? ((salesStats.length > 0 ? salesStats[0].totalVolume : 0) / totalTargets) * 100 : 0
    },
    statusDistribution: statusDist.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    totalClients,
    teamRanking: teamRanking.slice(0, 5), // Top 5
    recentSales: allSalesForQuarter
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
  };

  dashboardCache.set(quarterId, result);
  return result;
};

module.exports = { getDashboardStats, clearDashboardCache };
