const Joi = require('joi');

const createClientSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().allow(null, '').optional(),
  phone: Joi.string().allow(null, '').optional(),
  code: Joi.string().allow(null, '').optional(),
  taxRegistrationNumber: Joi.string().allow(null, '').optional(),
  googleMapsLink: Joi.string().uri().allow(null, '').optional(),
  isActive: Joi.boolean().optional()
});

const updateClientSchema = Joi.object({
  name: Joi.string().trim().optional(),
  email: Joi.string().email().allow(null, '').optional(),
  phone: Joi.string().allow(null, '').optional(),
  code: Joi.string().allow(null, '').optional(),
  taxRegistrationNumber: Joi.string().allow(null, '').optional(),
  googleMapsLink: Joi.string().uri().allow(null, '').optional(),
  isActive: Joi.boolean().optional()
});

module.exports = { createClientSchema, updateClientSchema };
