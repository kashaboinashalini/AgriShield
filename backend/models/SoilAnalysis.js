const mongoose = require('mongoose');
module.exports = mongoose.model('SoilAnalysis', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  ph: Number, nitrogen: Number, phosphorus: Number, potassium: Number,
  moisture: Number, soilType: String, temperature: Number, location: String,
  score: Number, phCondition: String, nitrogenStatus: String,
  phosphorusStatus: String, potassiumStatus: String, moistureStatus: String,
  suitableCrops: [String], recommendations: [String],
}, { timestamps: true }));
