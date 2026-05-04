const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response.utils');
const { getQuarterId } = require('../utils/quarter.utils');

const getStats = async (req, res, next) => {
  try {
    const quarterId = req.query.quarterId || getQuarterId(new Date());
    const stats = await dashboardService.getDashboardStats(quarterId);
    
    // Map to frontend interface
    const mappedStats = {
      totalRevenue: stats.overview.totalGross || 0,
      totalVolume: stats.overview.totalVolume || 0,
      totalSales: stats.overview.salesCount || 0,
      confirmedSales: stats.statusDistribution.confirmed || 0,
      pendingClaims: (stats.statusDistribution.confirmed || 0) + (stats.statusDistribution.claimed || 0),
      collectedClaims: stats.statusDistribution.collected || 0,
      targetCompletion: Math.round(stats.targets.achievedPercentage || 0),
      totalClients: stats.totalClients || 0,
      teamPerformance: stats.teamRanking.map(t => ({
        teamName: t.teamName,
        revenue: t.achieved,
        salesCount: t.salesCount
      })),
      recentSales: stats.recentSales || []
    };

    return sendSuccess(res, mappedStats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
