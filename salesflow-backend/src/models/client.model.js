const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  code:                  { type: String, unique: true },    // CLT-XXXX auto-generated
  name:                  { type: String, required: true, trim: true },
  email:                 { type: String, trim: true, lowercase: true },
  phone:                 { type: String, trim: true },
  taxRegistrationNumber: { type: String, default: null },
  googleMapsLink:        { type: String, default: null },
  isActive:              { type: Boolean, default: true }
}, { timestamps: true });

clientSchema.index({ name: 1 });

module.exports = mongoose.model('Client', clientSchema);
