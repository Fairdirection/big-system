const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  name: Joi.string().trim().required(),
  nationalId: Joi.string().required(),
  department: Joi.string().valid(
    'Operations', 'IT', 'Marketing', 'HR', 'Finance', 'Sales', 'TopManagement'
  ).required(),
  managerId: Joi.string().length(24).required(),

  // Conditional sales fields
  jobTitle: Joi.string().allow(null, '').optional(),
  seniorityLevel: Joi.string().valid('Fresh', 'BA', 'BC', 'Senior', 'SV', 'TeamLeader', 'SalesManager').allow(null, '').optional(),
  target: Joi.number().min(0).allow(null).optional(),
  currentTeamId: Joi.string().length(24).allow(null, '').optional(),
  teamJoinDate: Joi.date().allow(null).optional(),

  hireDate: Joi.date().required(),
  endDate: Joi.date().optional().allow(null),
  email: Joi.string().email().required(),
  phone: Joi.string().required()
});

const updateEmployeeSchema = Joi.object({
  name: Joi.string().trim().optional(),
  nationalId: Joi.string().optional(),
  department: Joi.string().valid(
    'Operations', 'IT', 'Marketing', 'HR', 'Finance', 'Sales', 'TopManagement'
  ).optional(),
  managerId: Joi.string().length(24).optional(),

  // Conditional sales fields
  jobTitle: Joi.string().allow(null, '').optional(),
  seniorityLevel: Joi.string().valid('Fresh', 'BA', 'BC', 'Senior', 'SV', 'TeamLeader', 'SalesManager').allow(null, '').optional(),
  target: Joi.number().min(0).allow(null).optional(),
  currentTeamId: Joi.string().length(24).allow(null, '').optional(),
  teamJoinDate: Joi.date().allow(null).optional(),

  hireDate: Joi.date().optional(),
  endDate: Joi.date().optional().allow(null),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

const transferTeamSchema = Joi.object({
  newTeamId: Joi.string().length(24).required(),
  transferDate: Joi.date().required()
});

module.exports = { 
  createEmployeeSchema, 
  updateEmployeeSchema,
  transferTeamSchema
};
