const mongoose = require('mongoose');

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
        if (!sellers || sellers.length === 0) return true; // allow draft without sellers or validate elsewhere
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

saleSchema.index({ quarterId: 1, status: 1 });
saleSchema.index({ clientId: 1 });
saleSchema.index({ 'sellers.employeeId': 1, quarterId: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ isActive: 1, quarterId: 1, status: 1 });

module.exports = mongoose.model('Sale', saleSchema);
