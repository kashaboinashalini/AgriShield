const mongoose = require('mongoose');
module.exports = mongoose.model('PestScan', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  imagePath: String, crop: String, pest: String,
  confidence: Number, damageLevel: String,
  prevention: [String], action: String, demo: { type: Boolean, default: false },
}, { timestamps: true }));
