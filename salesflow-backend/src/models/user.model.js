const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  code:         { type: String, unique: true, sparse: true }, // Employee Code
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['admin'], default: 'admin' },
  avatarUrl:    { type: String, default: null },              // base64 data URL or external URL
  avatarOriginalUrl: { type: String, default: null },
  avatarCrop: {
    panX: { type: Number, default: 0 },
    panY: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 }
  },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
