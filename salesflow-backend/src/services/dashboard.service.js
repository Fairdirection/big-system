const Sale = require('../models/sale.model');
const Employee = require('../models/employee.model');
const Claim = require('../models/claim.model');
const Team = require('../models/team.model');
const EmployeeTeamHistory = require('../models/employee-team-history.model');
const employeeService = require('./employee.service');
const { getQuarterBounds, calculateEmployeeQuarterDays, calculateWorkingDays } = require('../utils/quarter.utils');

const getDashboardStats = async (quarterId) => {
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
  const salesEmployees = await Employee.find({ department: 'Sales', isActive: true });
  
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

    const adjustedTarget = (emp.target / 90) * actualWorkingDays;
    totalTargets += adjustedTarget || 0;
  }

  // 3. Team Ranking (Optimized single aggregation)
  const teams = await Team.find({ isActive: true }).lean();
  
  // Calculate revenue per team in memory using allSalesForQuarter
  const teamRevenueMap = {};
  const teamSalesCountMap = {};

  allSalesForQuarter.forEach(sale => {
    const saleId = sale._id.toString();
    const uniqueTeamsForThisSale = new Set();

    sale.sellers.forEach(seller => {
      const empId = seller.employeeId.toString();
      // Find which team this employee belongs to
      const team = teams.find(t => t.memberIds.some(m => m.toString() === empId));
      if (team) {
        const teamIdStr = team._id.toString();
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
    return {
      teamId: team._id,
      teamName: team.name,
      achieved: teamRevenueMap[tid] || 0,
      salesCount: teamSalesCountMap[tid] || 0
    };
  }).sort((a, b) => b.achieved - a.achieved);

  // 4. Client Count (Optimized)
  const totalClients = new Set(allSalesForQuarter.map(s => s.clientId?.toString()).filter(Boolean)).size;

  return {
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
};

module.exports = { getDashboardStats };
