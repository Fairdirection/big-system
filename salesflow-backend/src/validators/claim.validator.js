const Joi = require('joi');

const createClaimSchema = Joi.object({
  saleId: Joi.string().length(24).required(),
  notes: Joi.string().optional().allow('')
});

const updateClaimSchema = Joi.object({
  status: Joi.string().valid('pending', 'submitted', 'collected', 'disputed').optional(),
  collectionDate: Joi.date().optional().allow(null),
  collectedAmount: Joi.number().min(0).optional().allow(null),
  notes: Joi.string().optional().allow(''),
  commissionDue: Joi.number().min(0).optional(),
  invoiceStatus: Joi.string().optional().allow(''),
  expectedCollectionDate: Joi.date().optional().allow(null, ''),
  isActive: Joi.boolean().optional()
});

module.exports = { createClaimSchema, updateClaimSchema };
