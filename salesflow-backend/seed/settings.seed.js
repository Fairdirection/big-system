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
    console.log('Settings seeded successfully');
  } catch (error) {
    console.error('Error seeding settings:', error);
    throw error;
  }
};

module.exports = seedSettings;
