const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  overallRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  weatherRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  diseaseRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  pestRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  waterRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  soilRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  reasons: {
    weather: String, disease: String, pest: String, water: String, soil: String,
  },
  actions: [String],
  inputs: {
    temperature: Number, rainProbability: Number, humidity: Number, windSpeed: Number,
    soilMoisture: Number, crop: String, growthStage: String,
  },
  weatherAvailable: { type: Boolean, default: false },
  source: { type: String, default: 'Calculated Risk Engine' },
  dataType: { type: String, default: 'calculated' },
}, { timestamps: true });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
