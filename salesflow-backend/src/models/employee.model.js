const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  code:       { type: String, unique: true },  // EMP-XXXX, auto-generated
  name:       { type: String, required: true, trim: true },
  nationalId: { type: String, required: true, unique: true },

  department: {
    type: String,
    required: true,
    enum: ['Operations', 'IT', 'Marketing', 'HR', 'Finance', 'Sales', 'TopManagement']
  },

  // Sales-only fields
  jobTitle:       { type: String },
  seniorityLevel: {
    type: String,
    enum: ['Fresh', 'BA', 'BC', 'Senior', 'SV', 'TeamLeader', 'SalesManager', null],
    default: null
  },
  target:         { type: Number, default: null },          // full quarterly target EGP
  currentTeamId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  teamJoinDate:   { type: Date, default: null },

  // General fields
  hireDate:   { type: Date, required: true },
  endDate:    { type: Date, default: null },
  managerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  email:      { type: String, required: false, lowercase: true, default: "" },
  phone:      { type: String, required: false, default: "" },

  avatarUrl: { type: String, default: null },              // base64 data URL or external URL
  avatarOriginalUrl: { type: String, default: null },
  avatarCrop: {
    panX: { type: Number, default: 0 },
    panY: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 }
  },

  // Computed/cached
  totalWorkingDays:           { type: Number, default: 0 },
  currentQuarterWorkingDays:  { type: Number, default: 0 },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

employeeSchema.index({ department: 1, isActive: 1 });
employeeSchema.index({ currentTeamId: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
