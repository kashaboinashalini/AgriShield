const GovernmentScheme = require('../models/GovernmentScheme');
exports.list = async (req, res) => {
  const { state, farmerType, crop, landSize } = req.query;
  const q = {};
  if (state) q.state = new RegExp(state, 'i');
  if (farmerType) q.farmerType = new RegExp(farmerType, 'i');
  if (crop) q.crop = new RegExp(crop, 'i');
  let data = await GovernmentScheme.find(q);
  if (landSize) data = data.filter(s => s.landSizeCriteria && (s.landSizeCriteria.toLowerCase().includes('all') || s.landSizeCriteria.toLowerCase().includes(landSize.toLowerCase())));
  res.json({ success: true, data });
};

exports.getById = async (req, res) => {
  const scheme = await GovernmentScheme.findById(req.params.id);
  if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });
  res.json({ success: true, data: scheme });
};
