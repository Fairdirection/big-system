const mongoose = require('mongoose');

const employeeTeamHistorySchema = new mongoose.Schema({
  employeeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  teamId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  joinDate:         { type: Date, required: true },
  leaveDate:        { type: Date, default: null },          // null = currently in this team
  workingDaysInTeam:{ type: Number, default: 0 },
  quarterId:        { type: String }                        // e.g. "Q2-2026"
}, { timestamps: true });

employeeTeamHistorySchema.index({ employeeId: 1, quarterId: 1 });
employeeTeamHistorySchema.index({ teamId: 1 });
employeeTeamHistorySchema.index({ employeeId: 1, leaveDate: 1 });

module.exports = mongoose.model('EmployeeTeamHistory', employeeTeamHistorySchema);
