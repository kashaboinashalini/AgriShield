const ProfitCalculation = require('../models/ProfitCalculation');

// POST /api/profit/calculate
// Revenue = Yield × Area × Selling Price
// Total Cost = Seed + Fertilizer + Pesticide + Labor + Irrigation + Machinery + Transportation + Other
// Profit = Revenue − Total Cost
// ROI = Profit / Total Cost × 100
// Break-even Price = Total Cost / Total Production
exports.calculate = async (req, res) => {
  try {
    const b = req.body;
    const num = (v) => Number(v) || 0;
    const farmArea = num(b.farmArea);
    if (farmArea <= 0) return res.status(400).json({ success: false, message: 'Farm area must be greater than 0.' });

    const totalInvestment = ['seedCost', 'fertilizerCost', 'labourCost', 'irrigationCost', 'pesticideCost', 'machineryCost', 'transportationCost', 'otherCost']
      .reduce((s, k) => s + num(b[k]), 0);
    const expectedProduction = num(b.expectedYield) * farmArea;
    const expectedRevenue = expectedProduction * num(b.sellingPrice);
    const estimatedProfit = expectedRevenue - totalInvestment;
    const profitMargin = expectedRevenue > 0 ? Math.round((estimatedProfit / expectedRevenue) * 100) : 0;
    const roi = totalInvestment > 0 ? Math.round((estimatedProfit / totalInvestment) * 1000) / 10 : 0;
    const breakEvenPrice = expectedProduction > 0 ? Math.round((totalInvestment / expectedProduction) * 100) / 100 : 0;

    const result = await ProfitCalculation.create({
      user: req.user.id, farm: b.farm || undefined, crop: b.crop || '',
      farmArea, unit: b.unit || 'acres',
      seedCost: num(b.seedCost), fertilizerCost: num(b.fertilizerCost), labourCost: num(b.labourCost),
      irrigationCost: num(b.irrigationCost), pesticideCost: num(b.pesticideCost),
      machineryCost: num(b.machineryCost), transportationCost: num(b.transportationCost), otherCost: num(b.otherCost),
      expectedYield: num(b.expectedYield), sellingPrice: num(b.sellingPrice),
      totalInvestment, expectedProduction, expectedRevenue, estimatedProfit, profitMargin,
      costPerAcre: Math.round((totalInvestment / farmArea) * 100) / 100,
      revenuePerAcre: Math.round((expectedRevenue / farmArea) * 100) / 100,
      profitPerAcre: Math.round((estimatedProfit / farmArea) * 100) / 100,
      roi, breakEvenPrice,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Profit calculation failed.', error: e.message });
  }
};

// GET /api/profit — saved calculations
exports.history = async (req, res) => {
  const data = await ProfitCalculation.find({ user: req.user.id }).sort('-createdAt');
  res.json({ success: true, data });
};
