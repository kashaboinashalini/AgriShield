const mongoose = require('mongoose');
module.exports = mongoose.model('Crop', new mongoose.Schema({
  name: { type: String, required: true }, season: { type: [String], default: [] },
  durationDays: Number, waterRequirement: String,
  expectedYieldPerAcre: Number, estimatedProfitPerAcre: Number,
  suitableSoils: [String], requirements: String,
}));
