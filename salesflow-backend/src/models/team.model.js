const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name:         { type: String },                           // auto = leader's name
  teamLeaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  memberIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

teamSchema.index({ teamLeaderId: 1 });
teamSchema.index({ isActive: 1 });

module.exports = mongoose.model('Team', teamSchema);
