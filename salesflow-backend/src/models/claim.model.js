const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, unique: true },             // CLM-XXXX auto-generated
  saleId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, unique: true },

  // Denormalized from sale
  saleNumber:   { type: String },
  projectName:  { type: String },
  unitNumber:   { type: String },
  clientName:   { type: String },
  quarterId:    { type: String, index: true },   // e.g. "Q2-2026"

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

claimSchema.index({ status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
