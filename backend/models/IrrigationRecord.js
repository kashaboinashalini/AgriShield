const mongoose = require('mongoose');
module.exports = mongoose.model('IrrigationRecord', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  crop: String, soilMoisture: Number, temperature: Number, humidity: Number,
  rainProbability: Number, lastIrrigationHours: Number, growthStage: String,
  decision: String, reason: String,
}, { timestamps: true }));
