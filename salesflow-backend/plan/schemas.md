# 🗄️ Database Schemas — SalesFlow (MongoDB + Mongoose)

---

## Connection
```
Database name: salesflow_db
ODM: Mongoose
Connection string: mongodb://localhost:27017/salesflow_db
```

---

## 1. User Schema

```javascript
// models/user.model.js
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['admin'], default: 'admin' },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

// Index
userSchema.index({ email: 1 });
```

---

## 2. Employee Schema

```javascript
// models/employee.model.js
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
    enum: ['Fresh', 'BA', 'BC', 'Senior', 'SV', 'TeamLeader', 'SalesManager'],
    default: null
  },
  target:         { type: Number, default: null },          // full quarterly target EGP
  currentTeamId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  teamJoinDate:   { type: Date, default: null },

  // General fields
  hireDate:   { type: Date, required: true },
  endDate:    { type: Date, default: null },
  managerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  phone:      { type: String, required: true },

  // Computed/cached
  totalWorkingDays:           { type: Number, default: 0 },
  currentQuarterWorkingDays:  { type: Number, default: 0 },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
employeeSchema.index({ code: 1 });
employeeSchema.index({ department: 1, isActive: 1 });
employeeSchema.index({ currentTeamId: 1 });
employeeSchema.index({ nationalId: 1 });
```

---

## 3. Employee Team History Schema

```javascript
// models/employee-team-history.model.js
const employeeTeamHistorySchema = new mongoose.Schema({
  employeeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  teamId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  joinDate:         { type: Date, required: true },
  leaveDate:        { type: Date, default: null },          // null = currently in this team
  workingDaysInTeam:{ type: Number, default: 0 },
  quarterId:        { type: String }                        // e.g. "Q2-2026"
}, { timestamps: true });

// Indexes
employeeTeamHistorySchema.index({ employeeId: 1, quarterId: 1 });
employeeTeamHistorySchema.index({ teamId: 1 });
employeeTeamHistorySchema.index({ employeeId: 1, leaveDate: 1 });
```

---

## 4. Team Schema

```javascript
// models/team.model.js
const teamSchema = new mongoose.Schema({
  name:         { type: String },                           // auto = leader's name
  teamLeaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  memberIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
teamSchema.index({ teamLeaderId: 1 });
teamSchema.index({ isActive: 1 });
```

---

## 5. Client Schema

```javascript
// models/client.model.js
const clientSchema = new mongoose.Schema({
  code:                  { type: String, unique: true },    // CLT-XXXX auto-generated
  name:                  { type: String, required: true, trim: true },
  taxRegistrationNumber: { type: String, default: null },
  googleMapsLink:        { type: String, default: null },
  isActive:              { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
clientSchema.index({ code: 1 });
clientSchema.index({ name: 1 });
```

---

## 6. Sale Schema

```javascript
// models/sale.model.js

const sellerSubSchema = new mongoose.Schema({
  employeeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName:     { type: String },                       // denormalized
  sharePercentage:  { type: Number, required: true },       // must sum to 100 across all sellers
  commissionValue:  { type: Number },                       // sharePercentage% × grossCommissionWithVAT
  isManualOverride: { type: Boolean, default: false }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  saleNumber: { type: String, unique: true },               // SALE-XXXX auto-generated

  // Source & dates
  source:                  { type: String, required: true },
  isPrivateSource:         { type: Boolean, default: false },
  bookingDate:             { type: Date },
  contractDate:            { type: Date, required: true },
  clientRegistrationDate:  { type: Date },                  // null if private source

  // Unit info
  unitLocation:  { type: String },                          // Google Maps link
  projectName:   { type: String, required: true },
  clientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  clientName:    { type: String },                          // denormalized
  unitNumber:    { type: String, required: true },
  unitType:      { type: String, required: true },
  unitValue:     { type: Number, required: true },          // contract price EGP

  // Commission inputs
  developerCollectionPercentage: { type: Number, required: true }, // 100, 50, 33.333, 25, or custom
  contractCommissionPercentage:  { type: Number, required: true },
  incentivePercentage:           { type: Number, default: 0 },

  // Commission calculated
  collectedCommissionPercentage: { type: Number },   // = contractCommission% × devCollection%
  grossCommissionWithVAT:        { type: Number },   // = collectedCommission% × unitValue
  netRevenue:                    { type: Number },   // = gross / 1.14
  vat:                           { type: Number },   // = netRevenue × 0.14
  withholdingTax:                { type: Number },   // = netRevenue × 0.05
  invoiceAmount:                 { type: Number },   // = netRevenue + vat - withholdingTax

  // Invoice
  invoiceStatus:          { type: String, required: true },
  expectedCollectionDate: { type: Date },

  // Sellers (1 to 4)
  sellers: {
    type: [sellerSubSchema],
    validate: {
      validator: function(sellers) {
        const total = sellers.reduce((sum, s) => sum + s.sharePercentage, 0);
        return Math.abs(total - 100) < 0.01;  // allow tiny float errors
      },
      message: 'Seller share percentages must sum to 100%'
    }
  },

  // Tracking
  quarterId: { type: String },                             // e.g. "Q2-2026"
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'claimed', 'collected'],
    default: 'draft'
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ quarterId: 1, status: 1 });
saleSchema.index({ clientId: 1 });
saleSchema.index({ 'sellers.employeeId': 1, quarterId: 1 });
saleSchema.index({ status: 1 });
```

---

## 7. Claim Schema

```javascript
// models/claim.model.js
const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, unique: true },             // CLM-XXXX auto-generated
  saleId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, unique: true },

  // Denormalized from sale
  saleNumber:   { type: String },
  projectName:  { type: String },
  unitNumber:   { type: String },
  clientName:   { type: String },

  // Financial
  commissionDue:          { type: Number },
  invoiceStatus:          { type: String },
  expectedCollectionDate: { type: Date },

  // Collection result
  status: {
    type: String,
    enum: ['pending', 'submitted', 'collected', 'disputed'],
    default: 'pending'
  },
  collectionDate:   { type: Date, default: null },
  collectedAmount:  { type: Number, default: null },
  notes:            { type: String, default: null },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
claimSchema.index({ claimNumber: 1 });
claimSchema.index({ saleId: 1 });
claimSchema.index({ status: 1 });
```

---

## 8. Settings Schema

```javascript
// models/setting.model.js
const settingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['saleSource', 'invoiceType', 'collectionPercentage']
  },
  value:     { type: String, required: true },             // actual stored value
  label:     { type: String, required: true },             // display label
  isDefault: { type: Boolean, default: false },            // system defaults can't be deleted
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes
settingSchema.index({ type: 1, isActive: 1 });
```

---

## Auto-Code Generation Utility

```javascript
// utils/code-generator.js

async function generateCode(model, field, prefix, padLength = 4) {
  // Find the highest existing code
  const last = await model.findOne({}, { [field]: 1 })
    .sort({ [field]: -1 })
    .lean();

  let nextNum = 1;
  if (last && last[field]) {
    const num = parseInt(last[field].replace(prefix + '-', ''));
    nextNum = num + 1;
  }

  return `${prefix}-${String(nextNum).padStart(padLength, '0')}`;
}

// Usage:
// await generateCode(Employee, 'code', 'EMP')  → "EMP-0042"
// await generateCode(Client, 'code', 'CLT')    → "CLT-0007"
// await generateCode(Sale, 'saleNumber', 'SALE') → "SALE-0123"
// await generateCode(Claim, 'claimNumber', 'CLM') → "CLM-0015"
```

---

## Quarter Utility Functions

```javascript
// utils/quarter.utils.js

function getQuarterId(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const q = Math.ceil(month / 3);
  return `Q${q}-${year}`;
}

function getQuarterBounds(quarterId) {
  const parts = quarterId.split('-');
  const qNum = parseInt(parts[0].replace('Q', ''));
  const year = parseInt(parts[1]);
  const startMonth = (qNum - 1) * 3;
  const endMonth = qNum * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth, 0, 23, 59, 59);
  return { start, end };
}

function calculateWorkingDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate || new Date());
  const diffMs = end - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function calculateEmployeeQuarterDays(historyRecords, quarterId) {
  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);
  let totalDays = 0;

  for (const record of historyRecords) {
    const effectiveStart = new Date(Math.max(qStart, new Date(record.joinDate)));
    const effectiveEnd = new Date(Math.min(qEnd, record.leaveDate ? new Date(record.leaveDate) : new Date()));
    if (effectiveEnd > effectiveStart) {
      totalDays += calculateWorkingDays(effectiveStart, effectiveEnd);
    }
  }

  return totalDays;
}

module.exports = { getQuarterId, getQuarterBounds, calculateWorkingDays, calculateEmployeeQuarterDays };
```

---

## Commission Calculation Utility

```javascript
// utils/commission.utils.js

function calculateCommission({ unitValue, contractCommissionPercentage, developerCollectionPercentage }) {
  const collectedCommissionPercentage =
    (contractCommissionPercentage / 100) * (developerCollectionPercentage / 100) * 100;

  const grossCommissionWithVAT = (collectedCommissionPercentage / 100) * unitValue;
  const netRevenue = grossCommissionWithVAT / 1.14;
  const vat = netRevenue * 0.14;
  const withholdingTax = netRevenue * 0.05;
  const invoiceAmount = netRevenue + vat - withholdingTax;

  return {
    collectedCommissionPercentage: round2(collectedCommissionPercentage),
    grossCommissionWithVAT:        round2(grossCommissionWithVAT),
    netRevenue:                    round2(netRevenue),
    vat:                           round2(vat),
    withholdingTax:                round2(withholdingTax),
    invoiceAmount:                 round2(invoiceAmount)
  };
}

function calculateSellerCommissions(sellers, grossCommissionWithVAT) {
  return sellers.map(seller => ({
    ...seller,
    commissionValue: round2((seller.sharePercentage / 100) * grossCommissionWithVAT)
  }));
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

module.exports = { calculateCommission, calculateSellerCommissions };
```
