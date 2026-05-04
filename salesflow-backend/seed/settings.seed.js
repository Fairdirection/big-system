const Setting = require('../src/models/setting.model');

const defaultSettings = [
  // Sale Sources
  { type: 'saleSource', value: 'Private', label: 'Private', isDefault: true, sortOrder: 1 },
  { type: 'saleSource', value: 'Website', label: 'Website', isDefault: true, sortOrder: 2 },
  { type: 'saleSource', value: 'Referral', label: 'Referral', isDefault: true, sortOrder: 3 },
  { type: 'saleSource', value: 'Walk-in', label: 'Walk-in', isDefault: true, sortOrder: 4 },

  // Invoice Types
  { type: 'invoiceType', value: 'Standard Tax Invoice', label: 'Standard Tax Invoice', isDefault: true, sortOrder: 1 },
  { type: 'invoiceType', value: 'Standard Non-Tax Invoice', label: 'Standard Non-Tax Invoice', isDefault: true, sortOrder: 2 },
  { type: 'invoiceType', value: 'Electronic Tax Invoice', label: 'Electronic Tax Invoice', isDefault: true, sortOrder: 3 },

  // Collection Percentages
  { type: 'collectionPercentage', value: '100', label: '100%', isDefault: true, sortOrder: 1 },
  { type: 'collectionPercentage', value: '50', label: '50%', isDefault: true, sortOrder: 2 },
  { type: 'collectionPercentage', value: '33.333', label: '33.333%', isDefault: true, sortOrder: 3 },
  { type: 'collectionPercentage', value: '25', label: '25%', isDefault: true, sortOrder: 4 },
];

const seedSettings = async () => {
  try {
    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { type: setting.type, value: setting.value },
        setting,
        { upsert: true, new: true }
      );
    }
    console.log('Settings seeded successfully');
  } catch (error) {
    console.error('Error seeding settings:', error);
    throw error;
  }
};

module.exports = seedSettings;
