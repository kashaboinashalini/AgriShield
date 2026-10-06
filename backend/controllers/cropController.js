const { recommendCrops } = require('../services/cropService');

// POST /api/crops/recommend — rule-based suitability engine
exports.recommend = async (req, res) => {
  try {
    const b = req.body;
    if (!b.soilType || b.ph === undefined) return res.status(400).json({ success: false, message: 'Soil type and pH are required.' });
    const ph = Number(b.ph);
    if (isNaN(ph) || ph < 0 || ph > 14) return res.status(400).json({ success: false, message: 'pH must be between 0 and 14.' });
    const input = {
      ...b, ph,
      nitrogen: Number(b.nitrogen) || 30, phosphorus: Number(b.phosphorus) || 25, potassium: Number(b.potassium) || 30,
      temperature: Number(b.temperature) || 28, rainfall: Number(b.rainfall) || 80,
    };
    const recommendations = recommendCrops(input);
    res.json({ success: true, data: { input, recommendations, source: 'Rule-based recommendation engine', dataType: 'calculated' } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Crop recommendation failed.', error: e.message });
  }
};
