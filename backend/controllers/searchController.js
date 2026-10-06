const Farm = require('../models/Farm');
const FarmTask = require('../models/FarmTask');
const GovernmentScheme = require('../models/GovernmentScheme');
const CropScan = require('../models/CropScan');
const PestScan = require('../models/PestScan');
const MarketPrice = require('../models/MarketPrice');

// GET /api/search?q=... — global search across farms, crops, tasks, schemes, scans and market data
exports.search = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ success: true, data: { farms: [], crops: [], tasks: [], schemes: [], scans: [], markets: [] } });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [farms, tasks, schemes, cropScans, pestScans, markets] = await Promise.all([
      Farm.find({ user: req.user.id, $or: [{ farmName: rx }, { village: rx }, { district: rx }, { state: rx }, { currentCrop: rx }, { soilType: rx }] }).limit(10),
      FarmTask.find({ user: req.user.id, $or: [{ title: rx }, { crop: rx }, { type: rx }] }).limit(10),
      GovernmentScheme.find({ $or: [{ name: rx }, { state: rx }, { crop: rx }, { description: rx }] }).limit(10),
      CropScan.find({ user: req.user.id, $or: [{ crop: rx }, { disease: rx }] }).limit(10),
      PestScan.find({ user: req.user.id, $or: [{ crop: rx }, { pest: rx }] }).limit(10),
      MarketPrice.find({ $or: [{ crop: rx }, { market: rx }, { state: rx }, { district: rx }] }).limit(10),
    ]);
    const cropNames = [...new Set([...cropScans.map(s => s.crop), ...pestScans.map(s => s.crop)].filter(Boolean))].slice(0, 10);
    res.json({
      success: true,
      data: {
        query: q,
        farms, crops: cropNames.map(c => ({ name: c })), tasks, schemes,
        scans: [...cropScans.map(s => ({ kind: 'crop', id: s._id, title: `${s.crop} — ${s.disease}`, date: s.createdAt, confidence: s.confidence })),
                ...pestScans.map(s => ({ kind: 'pest', id: s._id, title: `${s.crop} — ${s.pest}`, date: s.createdAt, confidence: s.confidence }))].sort((a, b) => b.date - a.date).slice(0, 10),
        markets,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Search failed.', error: e.message });
  }
};
