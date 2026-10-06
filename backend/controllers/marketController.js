const { listPrices, trends } = require('../services/marketService');

// GET /api/markets/prices — crop, state, district, market filters
exports.markets = async (req, res) => {
  try {
    const result = await listPrices(req.query);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(503).json({ success: false, message: 'Market data service unavailable. Please try again.' });
  }
};

exports.trends = async (req, res) => {
  try {
    const result = await trends(req.query);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(503).json({ success: false, message: 'Market data service unavailable. Please try again.' });
  }
};
