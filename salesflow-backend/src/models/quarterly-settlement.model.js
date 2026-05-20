const mongoose = require('mongoose');

const quarterlySettlementSchema = new mongoose.Schema({
  employeeId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  quarterId:             { type: String, required: true }, // e.g. "Q2-2026"
  seniorityLevel:        { type: String, required: true }, // seniority level during the quarter
  
  quarterlyTarget:       { type: Number, required: true }, // EGP (adjusted or standard)
  actualWorkingDays:     { type: Number, required: true },
  
  achievedSalesValue:    { type: Number, required: true }, // EGP (factoring in 1/3 target rule)
  achievementPercentage: { type: Number, required: true }, // %
  finalTierRate:         { type: Number, required: true }, // EGP per million for company rate sales
  
  totalEarnedCommission: { type: Number, required: true }, // final calculated commission for all sales in quarter
  totalPaidMinimums:     { type: Number, required: true }, // total of monthly minimum payouts already paid/projected
  settlementDifference:  { type: Number, required: true }, // totalEarned - totalPaidMinimums (positive = bonus, negative = clawback)
  
  settledAt:             { type: Date, default: null },
  status:                { type: String, enum: ['draft', 'settled'], default: 'draft' },
  triggeredBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  triggeredAt:           { type: Date, default: null },
  notes:                 { type: String },
  deletedAt:             { type: Date, default: null }
}, { timestamps: true });

quarterlySettlementSchema.index({ employeeId: 1, quarterId: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlySettlement', quarterlySettlementSchema);
