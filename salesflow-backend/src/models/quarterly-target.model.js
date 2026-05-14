const mongoose = require('mongoose');

const quarterlyTargetSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  quarterId:  { type: String, required: true }, // e.g., "Q1-2026", "Q2-2026"
  target:     { type: Number, required: true }
}, { timestamps: true });

quarterlyTargetSchema.index({ employeeId: 1, quarterId: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlyTarget', quarterlyTargetSchema);
