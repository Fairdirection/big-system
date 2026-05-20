const commissionService = require('../services/commission.service');
const Employee = require('../models/employee.model');
const CommissionPayout = require('../models/commission-payout.model');
const QuarterlySettlement = require('../models/quarterly-settlement.model');

/**
 * Gets commission progress and details for a specific salesperson
 */
const getSalespersonCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { quarterId } = req.query;

    if (!quarterId) {
      return res.status(400).json({ success: false, message: 'quarterId is required' });
    }

    const result = await commissionService.calculateEmployeeQuarterCommissions(id, quarterId);

    const payouts = await CommissionPayout.find({ employeeId: id, quarterId, deletedAt: null }).lean();
    const settlement = await QuarterlySettlement.findOne({ employeeId: id, quarterId, deletedAt: null }).lean();

    res.json({
      success: true,
      data: {
        ...result,
        payouts,
        settlement
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Simulation dry-run for commission calculation
 */
const VALID_ROLES = ['Fresh', 'BA', 'BC', 'Senior', 'SV', 'TeamLeader'];

const simulateCommission = async (req, res) => {
  try {
    // Handle both body (POST) and query params (GET) for maximum flexibility
    const params = req.method === 'POST' ? req.body : req.query;
    const { role, salesAmount, developerRate, saleSource, quarterTotal } = params;

    if (!role || salesAmount === undefined || developerRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'role, salesAmount, and developerRate are required'
      });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }
    const parsedAmount = parseFloat(salesAmount);
    const parsedRate = parseFloat(developerRate);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'salesAmount must be a positive number' });
    }
    if (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 20) {
      return res.status(400).json({ success: false, message: 'developerRate must be between 0.01 and 20' });
    }

    const result = commissionService.simulateCommission(
      role,
      parsedAmount,
      parsedRate,
      saleSource || 'Company',
      quarterTotal ? parseFloat(quarterTotal) : 0
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Runs end-of-quarter settlement for an employee
 */
const triggerQuarterlySettlement = async (req, res) => {
  try {
    const { quarter, year } = req.params;
    const { employeeId } = req.body;
    const quarterId = `Q${quarter}-${year}`;

    if (!quarterId.match(/^Q[1-4]-\d{4}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid quarter format. Use Q1-2026 style.' });
    }

    const triggeredBy = req.user?._id || req.user?.id || null;
    const triggeredAt = new Date();

    const runSettlement = async (empId) => {
      // Block re-running an already-settled quarter for this employee
      const existing = await QuarterlySettlement.findOne({ employeeId: empId, quarterId, deletedAt: null });
      if (existing && existing.status === 'settled') {
        throw new Error(`Settlement for ${quarterId} is already finalised for employee ${empId}`);
      }
      const sett = await commissionService.runQuarterlySettlement(empId, quarterId);
      await QuarterlySettlement.findByIdAndUpdate(sett._id, { triggeredBy, triggeredAt });
      return sett;
    };

    if (employeeId) {
      const settlement = await runSettlement(employeeId);
      return res.json({ success: true, message: 'Settlement run completed', data: settlement });
    }

    // Run for ALL active sales employees when no specific employeeId is provided
    const salesEmployees = await Employee.find({ department: 'Sales', isActive: true });
    const settlements = [];
    const errors = [];
    for (const emp of salesEmployees) {
      try {
        const sett = await runSettlement(emp._id.toString());
        settlements.push(sett);
      } catch (err) {
        errors.push({ employeeId: emp._id, message: err.message });
      }
    }

    res.json({
      success: true,
      message: `Settlement run completed for ${settlements.length}/${salesEmployees.length} employees`,
      data: settlements,
      ...(errors.length > 0 && { errors })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieves the payout schedule for the team
 */
const getPayoutSchedule = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(200, parseInt(limit));
    const take = Math.min(200, parseInt(limit));

    const query = { deletedAt: null };
    if (status) query.status = status;

    if (startDate || endDate) {
      query.payoutDate = {};
      if (startDate) query.payoutDate.$gte = new Date(startDate);
      if (endDate) query.payoutDate.$lte = new Date(endDate);
    }

    const [payouts, total] = await Promise.all([
      CommissionPayout.find(query)
        .populate('employeeId', 'name code seniorityLevel')
        .populate('saleId', 'projectName unitNumber')
        .sort({ payoutDate: 1 })
        .skip(skip)
        .limit(take)
        .lean(),
      CommissionPayout.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: payouts,
      pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update the status of a payout record (e.g. approve or mark as paid)
 */
const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const payout = await CommissionPayout.findByIdAndUpdate(id, { status }, { new: true });
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    res.json({ success: true, message: 'Payout status updated successfully', data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSalespersonCommission,
  simulateCommission,
  triggerQuarterlySettlement,
  getPayoutSchedule,
  updatePayoutStatus
};
