const Joi = require('joi');

const createClientSchema = Joi.object({
  name: Joi.string().trim().required(),
  taxRegistrationNumber: Joi.string().allow(null, '').optional(),
  googleMapsLink: Joi.string().uri().allow(null, '').optional()
});

const updateClientSchema = Joi.object({
  name: Joi.string().trim().optional(),
  taxRegistrationNumber: Joi.string().allow(null, '').optional(),
  googleMapsLink: Joi.string().uri().allow(null, '').optional(),
  isActive: Joi.boolean().optional()
});

module.exports = { createClientSchema, updateClientSchema };
