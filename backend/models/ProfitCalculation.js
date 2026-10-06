const mongoose = require('mongoose');
module.exports = mongoose.model('ProfitCalculation', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  crop: String,
  farmArea: Number, unit: { type: String, default: 'acres' },
  seedCost: Number, fertilizerCost: Number, labourCost: Number,
  irrigationCost: Number, pesticideCost: Number, machineryCost: Number,
  transportationCost: Number, otherCost: Number,
  expectedYield: Number, sellingPrice: Number, totalInvestment: Number,
  expectedProduction: Number, expectedRevenue: Number, estimatedProfit: Number,
  profitMargin: Number, costPerAcre: Number, revenuePerAcre: Number,
  profitPerAcre: Number, roi: Number, breakEvenPrice: Number,
}, { timestamps: true }));
