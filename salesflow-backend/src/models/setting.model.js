const mongoose = require('mongoose');

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

settingSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Setting', settingSchema);
