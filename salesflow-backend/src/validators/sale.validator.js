const Joi = require('joi');

const appliedTaxSchema = Joi.object({
  label: Joi.string().required(),
  value: Joi.number().min(0).max(100).required(),
  type: Joi.string().valid('add', 'deduct').required()
});

const sellerSchema = Joi.object({
  employeeId: Joi.string().length(24).required(),
  sharePercentage: Joi.number().min(0).max(100).required(),
  isManualOverride: Joi.boolean().default(false)
});

const createSaleSchema = Joi.object({
  source: Joi.string().required(),
  isPrivateSource: Joi.boolean().default(false),
  bookingDate: Joi.date().optional(),
  contractDate: Joi.date().required(),
  clientRegistrationDate: Joi.date().optional().allow(null),

  unitLocation: Joi.string().optional().allow(''),
  projectName: Joi.string().required(),
  clientId: Joi.string().length(24).required(),
  unitNumber: Joi.string().required(),
  unitType: Joi.string().required(),
  unitValue: Joi.number().min(0).required(),

  developerCollectionPercentage: Joi.number().min(0).max(100).required(),
  contractCommissionPercentage: Joi.number().min(0).required(),
  incentivePercentage: Joi.number().min(0).default(0),
  vatPercentage: Joi.number().min(0).max(100).optional().default(14),
  withholdingTaxPercentage: Joi.number().min(0).max(100).optional().default(5),
  appliedTaxes: Joi.array().items(appliedTaxSchema).optional(),

  collectedCommissionPercentage: Joi.number().min(0).optional(),
  grossCommissionWithVAT: Joi.number().min(0).optional(),
  netRevenue: Joi.number().min(0).optional(),
  withholdingTax: Joi.number().min(0).optional(),
  invoiceAmount: Joi.number().min(0).optional(),

  invoiceStatus: Joi.string().required(),
  expectedCollectionDate: Joi.date().optional(),

  sellers: Joi.array().items(sellerSchema).min(1).max(4).required()
    .custom((sellers, helpers) => {
      const total = sellers.reduce((sum, s) => sum + s.sharePercentage, 0);
      if (Math.abs(total - 100) > 0.01) {
        return helpers.message('Seller share percentages must sum to 100%');
      }
      return sellers;
    }),
  
  status: Joi.string().valid('draft', 'confirmed').default('draft')
});

const updateSaleSchema = Joi.object({
  source: Joi.string().optional(),
  isPrivateSource: Joi.boolean().optional(),
  bookingDate: Joi.date().optional(),
  contractDate: Joi.date().optional(),
  clientRegistrationDate: Joi.date().optional().allow(null),

  unitLocation: Joi.string().optional().allow(''),
  projectName: Joi.string().optional(),
  clientId: Joi.string().length(24).optional(),
  unitNumber: Joi.string().optional(),
  unitType: Joi.string().optional(),
  unitValue: Joi.number().min(0).optional(),

  developerCollectionPercentage: Joi.number().min(0).max(100).optional(),
  contractCommissionPercentage: Joi.number().min(0).optional(),
  incentivePercentage: Joi.number().min(0).optional(),
  vatPercentage: Joi.number().min(0).max(100).optional(),
  withholdingTaxPercentage: Joi.number().min(0).max(100).optional(),
  appliedTaxes: Joi.array().items(appliedTaxSchema).optional(),

  collectedCommissionPercentage: Joi.number().min(0).optional(),
  grossCommissionWithVAT: Joi.number().min(0).optional(),
  netRevenue: Joi.number().min(0).optional(),
  withholdingTax: Joi.number().min(0).optional(),
  invoiceAmount: Joi.number().min(0).optional(),

  invoiceStatus: Joi.string().optional(),
  expectedCollectionDate: Joi.date().optional(),

  sellers: Joi.array().items(sellerSchema).min(1).max(4).optional()
    .custom((sellers, helpers) => {
      if (!sellers) return sellers;
      const total = sellers.reduce((sum, s) => sum + s.sharePercentage, 0);
      if (Math.abs(total - 100) > 0.01) {
        return helpers.message('Seller share percentages must sum to 100%');
      }
      return sellers;
    }),

  status: Joi.string().valid('draft', 'confirmed', 'claimed', 'collected').optional(),
  isActive: Joi.boolean().optional()
});

module.exports = { createSaleSchema, updateSaleSchema };
