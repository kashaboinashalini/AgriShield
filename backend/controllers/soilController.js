const SoilAnalysis = require('../models/SoilAnalysis');
const { analyzeSoil } = require('../services/soilService');
exports.analyze = async (req, res) => {
  const b = req.body;
  const num = (v) => Number(v);
  if (b.ph === undefined || num(b.ph) < 0 || num(b.ph) > 14) return res.status(400).json({ message: 'pH must be a number between 0 and 14.' });
  for (const f of ['nitrogen', 'phosphorus', 'potassium', 'moisture', 'temperature']) if (isNaN(num(b[f]))) return res.status(400).json({ message: `${f} is required.` });
  const result = analyzeSoil({ ph: num(b.ph), nitrogen: num(b.nitrogen), phosphorus: num(b.phosphorus), potassium: num(b.potassium), moisture: num(b.moisture), soilType: b.soilType, temperature: num(b.temperature) });
  const analysis = await SoilAnalysis.create({ user: req.user.id, farm: b.farm || undefined, ph: num(b.ph), nitrogen: num(b.nitrogen), phosphorus: num(b.phosphorus), potassium: num(b.potassium), moisture: num(b.moisture), soilType: b.soilType, temperature: num(b.temperature), location: b.location, ...result });
  res.json({ success: true, data: analysis });
};
exports.history = async (req, res) => res.json({ success: true, data: await SoilAnalysis.find({ user: req.user.id }).sort('-createdAt') });

exports.getById = async (req, res) => {
  const a = await SoilAnalysis.findOne({ _id: req.params.id, user: req.user.id });
  if (!a) return res.status(404).json({ success: false, message: 'Soil analysis not found.' });
  res.json({ success: true, data: a });
};
