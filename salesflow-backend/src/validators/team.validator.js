const Joi = require('joi');

const createTeamSchema = Joi.object({
  teamLeaderId: Joi.string().length(24).required(),
  memberIds: Joi.array().items(Joi.string().length(24)).optional()
});

const updateTeamSchema = Joi.object({
  teamLeaderId: Joi.string().length(24).optional(),
  memberIds: Joi.array().items(Joi.string().length(24)).optional(),
  isActive: Joi.boolean().optional()
});

const reassignMembersSchema = Joi.object({
  membersReassignment: Joi.array().items(
    Joi.object({
      employeeId: Joi.string().length(24).required(),
      newTeamId: Joi.string().length(24).required()
    })
  ).required()
});

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  reassignMembersSchema
};
