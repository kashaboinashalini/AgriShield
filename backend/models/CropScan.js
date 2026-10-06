const mongoose = require('mongoose');
module.exports = mongoose.model('CropScan', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  imagePath: String, crop: String, disease: String,
  confidence: Number, severity: String, risk: String,
  symptoms: [String], recommendations: [String], prevention: [String],
  demo: { type: Boolean, default: false },
}, { timestamps: true }));
