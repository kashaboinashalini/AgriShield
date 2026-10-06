const axios = require('axios');
const MarketPrice = require('../models/MarketPrice');

// AGMARKNET / data.gov.in commodity prices.
// Configure MARKET_RESOURCE_ID in .env for your data.gov.in dataset resource.
const RESOURCE = process.env.MARKET_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';

async function fetchGovernmentPrices({ apiKey, commodity } = {}) {
  const key = apiKey || process.env.MARKET_API_KEY;
  if (!key) return { available: false };
  const params = { 'api-key': key, format: 'json', limit: 100 };
  if (commodity) params['filters[commodity]'] = commodity;
  try {
    const res = await axios.get(`https://api.data.gov.in/resource/${RESOURCE}`, { params, timeout: 10000 });
    const records = (res.data.records || []).map((r) => ({
      crop: r.commodity, market: r.market, state: r.state, district: r.district,
      variety: r.variety, unit: r.unit,
      date: r.arrival_date ? new Date(r.arrival_date) : new Date(),
      pricePerKg: Number(r.modal_price), minimumPrice: Number(r.min_price), maximumPrice: Number(r.max_price),
    })).filter(r => !isNaN(r.pricePerKg));
    return { available: true, source: 'Government Market Data (AGMARKNET / data.gov.in)', records, lastUpdated: new Date().toISOString() };
  } catch (e) {
    return { available: false, error: 'Government market data service unavailable. Please try again.' };
  }
}

async function listPrices({ crop, market, from, to, district } = {}) {
  const live = await fetchGovernmentPrices({ commodity: crop });
  if (live.available && live.records.length) {
    let recs = live.records;
    if (market) recs = recs.filter(r => String(r.market).toLowerCase().includes(String(market).toLowerCase()));
    if (district) recs = recs.filter(r => String(r.district || '').toLowerCase().includes(String(district).toLowerCase()));
    return { data: recs.slice(0, 500), options: { markets: [...new Set(recs.map(r => r.market))], districts: [...new Set(recs.map(r => r.district).filter(Boolean))] }, source: live.source, lastUpdated: live.lastUpdated, label: 'Latest government market data' };
  }
  // Fallback: seeded historical reference dataset (development/demo dataset, explicitly labelled)
  const q = {};
  if (crop) q.crop = crop;
  if (market) q.market = new RegExp(market, 'i');
  if (from || to) { q.date = {}; if (from) q.date.$gte = new Date(from); if (to) q.date.$lte = new Date(to); }
  const data = await MarketPrice.find(q).sort('-date').limit(500);
  const options = { crops: await MarketPrice.distinct('crop'), markets: await MarketPrice.distinct('market') };
  return { data, options, source: 'Reference dataset (demo)', lastUpdated: new Date().toISOString(), label: 'Reference market dataset — configure MARKET_API_KEY for live government data', demo: true };
}

async function trends({ crop = 'Rice', market } = {}) {
  const live = await fetchGovernmentPrices({ commodity: crop });
  if (live.available && live.records.length) {
    const byDate = {};
    live.records.filter(r => !market || String(r.market).toLowerCase().includes(String(market).toLowerCase())).forEach(r => {
      const d = r.date.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { date: d, price: r.pricePerKg };
    });
    return { crop, market, series: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-60), source: live.source, lastUpdated: live.lastUpdated, demo: false };
  }
  const q = { crop };
  if (market) q.market = new RegExp(market, 'i');
  const data = await MarketPrice.find(q).sort('date').limit(60);
  return { crop, market, series: data.map(d => ({ date: d.date.toISOString().slice(0, 10), price: d.pricePerKg })), source: 'Reference dataset (demo)', lastUpdated: new Date().toISOString(), demo: true };
}

module.exports = { listPrices, trends, fetchGovernmentPrices };
