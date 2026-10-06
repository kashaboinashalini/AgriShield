const Farm = require('../models/Farm');
exports.satellite = async (req, res) => {
  const farm = await Farm.findOne({ _id: req.params.farmId, user: req.user.id });
  if (!farm) return res.status(404).json({ message: 'Farm not found.' });
  const base = (farm.area || 3) * 7 + (String(farm._id).charCodeAt(6) || 40);
  const grid = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
    const v = Math.abs(Math.sin(base + r * 3.1 + c * 1.7));
    return Math.round((0.2 + v * 0.75) * 100) / 100;
  }));
  const flat = grid.flat();
  const healthScore = Math.round((flat.reduce((a, b) => a + b, 0) / flat.length) * 100);
  const stressedZones = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (v < 0.45) stressedZones.push({ row: r + 1, col: c + 1, ndvi: v }); }));
  res.json({
    farm: farm.farmName, demo: true, label: 'Satellite Analysis — Demo Mode (simulated vegetation index, not real satellite imagery)',
    healthScore, healthBand: healthScore > 75 ? 'Good' : healthScore > 55 ? 'Moderate' : 'Stressed',
    grid, stressedZones: stressedZones.slice(0, 8),
    interpretation: healthScore > 75 ? 'Vegetation appears healthy over most of the field (simulated index).' : 'Several zones show simulated stress. Investigate highlighted cells.',
    dataType: 'demo',
    source: 'Simulated vegetation index (configure a satellite imagery provider for real data)',
  });
};
