const mongoose = require('mongoose');

const commissionPayoutSchema = new mongoose.Schema({
  employeeId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  saleId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  saleNumber:      { type: String, required: true },
  unitValue:       { type: Number, required: true },
  sharePercentage: { type: Number, required: true },
  sellerSaleValue: { type: Number, required: true }, // employee's share of the sale value
  
  developerCommissionRate: { type: Number, required: true },
  saleSource:              { type: String, enum: ['Company', 'Personal', 'Referral'], required: true },
  seniorityLevel:          { type: String, required: true }, // seniority level at the time of sale
  
  baseCommissionRate: { type: Number, required: true }, // per million EGP (e.g. 4500)
  grossAmount:        { type: Number, required: true }, // calculated base commission
  isMinimumTier:      { type: Boolean, default: true }, // true for monthly payouts at minimum tier
  
  incentivePercentage:  { type: Number, default: 0 },
  incentiveAmount:      { type: Number, default: 0 }, // total incentive amount for this employee
  managerIncentiveShare:{ type: Number, default: 0 }, // manager's share of incentive if applicable
  
  collectedAt:   { type: Date, required: true }, // date the developer commission was collected
  payoutDate:    { type: Date, required: true }, // scheduled payout date (10th or 20th)
  payoutCycle:   { type: String, enum: ['Cycle A', 'Cycle B'], required: true },
  quarterId:     { type: String, required: true }, // e.g. "Q2-2026"
  
  status:        { type: String, enum: ['pending', 'paid'], default: 'pending' },
  notes:         { type: String },
  deletedAt:     { type: Date, default: null }
}, { timestamps: true });

commissionPayoutSchema.index({ employeeId: 1, quarterId: 1 });
commissionPayoutSchema.index({ saleId: 1 });
commissionPayoutSchema.index({ payoutDate: 1, status: 1 });
// Prevent duplicate payouts for the same employee+sale combination
commissionPayoutSchema.index({ employeeId: 1, saleId: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

module.exports = mongoose.model('CommissionPayout', commissionPayoutSchema);
