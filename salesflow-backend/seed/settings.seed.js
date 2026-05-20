const Setting = require('../src/models/setting.model');

const defaultSettings = [
  // Sale Sources
  { type: 'saleSource', value: 'Facebook', label: 'فيسبوك', isDefault: true, sortOrder: 1 },
  { type: 'saleSource', value: 'Referral', label: 'ترشيح / عميل سابق', isDefault: true, sortOrder: 2 },
  { type: 'saleSource', value: 'Walk-in', label: 'تواصل مباشر / مقر الشركة', isDefault: true, sortOrder: 3 },
  { type: 'saleSource', value: 'Cold Call', label: 'مكالمات باردة', isDefault: true, sortOrder: 4 },
  { type: 'saleSource', value: 'Instagram', label: 'إنستجرام', isDefault: true, sortOrder: 5 },
  { type: 'saleSource', value: 'Exhibition', label: 'معرض عقاري', isDefault: true, sortOrder: 6 },
  { type: 'saleSource', value: 'Other', label: 'أخرى', isDefault: true, sortOrder: 7 },

  // Invoice Types
  { type: 'invoiceType', value: 'Standard Tax', label: 'فاتورة ضريبية قياسية', isDefault: true, sortOrder: 1 },
  { type: 'invoiceType', value: 'Electronic', label: 'فاتورة إلكترونية', isDefault: true, sortOrder: 2 },

  // Collection Percentages
  { type: 'collectionPercentage', value: '100', label: 'تحصيل كامل (100%)', isDefault: true, sortOrder: 1 },
  { type: 'collectionPercentage', value: '50', label: 'نصف التحصيل (50%)', isDefault: true, sortOrder: 2 },
  { type: 'collectionPercentage', value: '33.33', label: 'ثلث التحصيل (33.3%)', isDefault: true, sortOrder: 3 },
  { type: 'collectionPercentage', value: '25', label: 'ربع التحصيل (25%)', isDefault: true, sortOrder: 4 },

  // Default Taxes
  { type: 'tax', value: '14', label: 'ضريبة القيمة المضافة', isDefault: true, sortOrder: 1 },
  { type: 'tax', value: '5', label: 'ضريبة الخصم من المنبع (خدمات عقارية)', isDefault: true, sortOrder: 2 },
  { type: 'tax', value: '1', label: 'ضريبة الخصم والتحصيل (توريدات وتجارة)', isDefault: true, sortOrder: 3 },
];

const seedSettings = async () => {
  try {
    for (const setting of defaultSettings) {
      const exists = await Setting.findOne({ type: setting.type, value: setting.value });
      if (!exists) {
        await Setting.create(setting);
      }
    }

    const commissionRulesExist = await Setting.findOne({ type: 'commissionRules' });
    if (!commissionRulesExist) {
      const defaultCommissionRules = {
        'Fresh': {
          target: 21000000,
          companyRate: 4500,
          personalSlabs: [
            { maxRate: 2.9, ratePerMillion: 4500 },
            { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
            { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
            { minRate: 4.5, ratePerMillion: 10000 }
          ]
        },
        'BA': {
          target: 27000000,
          companyTiers: [
            { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
            { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5000 },
            { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 5500 },
            { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 6000 },
            { minAchievement: 150.0001, ratePerMillion: 6500 }
          ],
          personalSlabs: [
            { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
            { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
            { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
            { minRate: 4.5, ratePerMillion: 10000 }
          ]
        },
        'BC': {
          target: 30000000,
          companyTiers: [
            { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
            { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5000 },
            { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 6000 },
            { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 6500 },
            { minAchievement: 150.0001, ratePerMillion: 7000 }
          ],
          personalSlabs: [
            { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
            { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
            { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
            { minRate: 4.5, ratePerMillion: 10000 }
          ]
        },
        'Senior': {
          target: 36000000,
          companyTiers: [
            { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
            { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5500 },
            { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 6500 },
            { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 7000 },
            { minAchievement: 150.0001, ratePerMillion: 7500 }
          ],
          personalSlabs: [
            { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
            { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
            { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
            { minRate: 4.5, ratePerMillion: 10000 }
          ]
        },
        'SV': {
          target: 42000000,
          companyTiers: [
            { minAchievement: 0, maxAchievement: 50, ratePerMillion: 4500 },
            { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 5500 },
            { minAchievement: 75.0001, maxAchievement: 100, ratePerMillion: 7000 },
            { minAchievement: 100.0001, maxAchievement: 150, ratePerMillion: 7500 },
            { minAchievement: 150.0001, ratePerMillion: 8000 }
          ],
          personalSlabs: [
            { maxRate: 2.9, ratePerMillion: 4500, useCompanyTiers: true },
            { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
            { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
            { minRate: 4.5, ratePerMillion: 10000 }
          ]
        },
        'TeamLeader': {
          companyTiers: [
            { minAchievement: 0, maxAchievement: 50, ratePerMillion: 1800 },
            { minAchievement: 50.0001, maxAchievement: 75, ratePerMillion: 2000 },
            { minAchievement: 75.0001, maxAchievement: 120, ratePerMillion: 2200 },
            { minAchievement: 120.0001, maxAchievement: 150, ratePerMillion: 2400 },
            { minAchievement: 150.0001, ratePerMillion: 2600 }
          ],
          personalSlabs: [
            { maxRate: 2.9, ratePerMillion: 1500 },
            { minRate: 3.0, maxRate: 3.9, ratePerMillion: 7500 },
            { minRate: 4.0, maxRate: 4.5, ratePerMillion: 8500 },
            { minRate: 4.5, ratePerMillion: 10000 }
          ]
        }
      };

      await Setting.create({
        type: 'commissionRules',
        value: JSON.stringify(defaultCommissionRules),
        label: 'لائحة صرف العمولات',
        isDefault: true,
        sortOrder: 1
      });
    }

    console.log('Settings seeded successfully');
  } catch (error) {
    console.error('Error seeding settings:', error);
    throw error;
  }
};

module.exports = seedSettings;
