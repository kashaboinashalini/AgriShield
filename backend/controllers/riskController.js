const Farm = require('../models/Farm');
const mongoose = require('mongoose');
const CropScan = require('../models/CropScan');
const PestScan = require('../models/PestScan');
const SoilAnalysis = require('../models/SoilAnalysis');
const IrrigationRecord = require('../models/IrrigationRecord');
const RiskAssessment = require('../models/RiskAssessment');
const { getWeather } = require('../services/weatherService');
const { computeRisks, weatherRiskFrom } = require('../services/riskService');
const { disasterAlerts } = require('../services/disasterService');

async function gatherContext(user, farmId) {
  const farm = farmId ? await Farm.findOne({ _id: farmId, user }) : await Farm.findOne({ user }).sort('-createdAt');
  const q = farmId ? { farm: farmId } : {};
  const [latestScan, latestPest, soil, irrigation] = await Promise.all([
    CropScan.findOne({ user, ...q }).sort('-createdAt'),
    PestScan.findOne({ user, ...q }).sort('-createdAt'),
    SoilAnalysis.findOne({ user, ...q }).sort('-createdAt'),
    IrrigationRecord.findOne({ user, ...q }).sort('-createdAt'),
  ]);

  let weather = null;
  let weatherAvailable = false;
  try {
    const w = await getWeather({
      lat: farm?.latitude ?? undefined,
      lon: farm?.longitude ?? undefined,
      location: farm ? `${farm.village || ''}, ${farm.district || ''}, ${farm.state || ''}`.replace(/^,\s*|,\s*$/g, '') : undefined,
    });
    if (w && !w.unavailable) { weather = w; weatherAvailable = true; }
  } catch {}

  return { farm, latestScan, latestPest, soil, irrigation, weather, weatherAvailable };
}

// POST /api/risk/analyze  { farmId? }
exports.analyze = async (req, res) => {
  try {
    const { farm, latestScan, latestPest, soil, irrigation, weather, weatherAvailable } = await gatherContext(req.user.id, req.body.farmId);
    const risks = computeRisks({
      latestScan, latestPest, soil, irrigation, weather,
      crop: latestScan?.crop || farm?.currentCrop,
      growthStage: irrigation?.growthStage,
    });
    const assessment = await RiskAssessment.create({
      user: req.user.id, farm: farm?._id, ...risks,
      inputs: {
        temperature: weather?.temperature, rainProbability: weather?.rainProbability,
        humidity: weather?.humidity, windSpeed: weather?.windSpeed,
        soilMoisture: irrigation?.soilMoisture, crop: latestScan?.crop || farm?.currentCrop,
        growthStage: irrigation?.growthStage,
      },
      weatherAvailable,
      source: weatherAvailable ? 'Calculated Risk Engine (live weather inputs)' : 'Calculated Risk Engine (farm records)',
      dataType: 'calculated',
    });
    res.json({ success: true, data: { ...assessment.toObject(), weatherUnavailable: !weatherAvailable } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Risk analysis failed.', error: e.message });
  }
};

// GET /api/risk/:farmId — latest stored assessment, recomputed if missing
exports.farmRisks = async (req, res) => {
  try {
    // Guard against non-ObjectId params like "history"
    if (!mongoose.isValidObjectId(req.params.farmId)) return res.status(400).json({ success: false, message: 'Invalid farm id.' });
    const stored = await RiskAssessment.findOne({ user: req.user.id, farm: req.params.farmId }).sort('-createdAt');
    if (stored && Date.now() - stored.createdAt.getTime() < 6 * 3600000) {
      return res.json({ success: true, data: { ...stored.toObject(), cached: true } });
    }
    const { farm, latestScan, latestPest, soil, irrigation, weather, weatherAvailable } = await gatherContext(req.user.id, req.params.farmId);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
    const risks = computeRisks({ latestScan, latestPest, soil, irrigation, weather, crop: latestScan?.crop || farm?.currentCrop, growthStage: irrigation?.growthStage });
    const assessment = await RiskAssessment.create({
      user: req.user.id, farm: farm._id, ...risks,
      inputs: { temperature: weather?.temperature, rainProbability: weather?.rainProbability, humidity: weather?.humidity, windSpeed: weather?.windSpeed, soilMoisture: irrigation?.soilMoisture, crop: latestScan?.crop || farm?.currentCrop, growthStage: irrigation?.growthStage },
      weatherAvailable, source: 'Calculated Risk Engine', dataType: 'calculated',
    });
    res.json({ success: true, data: assessment });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Risk analysis failed.', error: e.message });
  }
};

// GET /api/risks — legacy user-level quick view
exports.risks = async (req, res) => {
  try {
    const { latestScan, latestPest, soil, irrigation, weather, weatherAvailable } = await gatherContext(req.user.id, req.query.farm);
    const risks = computeRisks({ latestScan, latestPest, soil, irrigation, weather });
    res.json({ success: true, data: { ...risks, weatherUnavailable: !weatherAvailable, weatherSource: weatherAvailable ? weather.source : null } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Risk analysis failed.', error: e.message });
  }
};

// GET /api/disasters — disaster monitoring from live weather only
exports.disasters = async (req, res) => {
  try {
    const farm = req.query.farm ? await Farm.findOne({ _id: req.query.farm, user: req.user.id }) : await Farm.findOne({ user: req.user.id }).sort('-createdAt');
    let weather = null;
    try {
      const w = await getWeather({ lat: farm?.latitude ?? undefined, lon: farm?.longitude ?? undefined, location: farm ? `${farm.village || ''}, ${farm.district || ''}, ${farm.state || ''}`.replace(/^,\s*|,\s*$/g, '') : (req.query.location || undefined) });
      if (w && !w.unavailable) weather = w;
    } catch {}
    if (!weather) {
      return res.json({ success: true, data: { alerts: [], unavailable: true, message: 'Live weather data is temporarily unavailable. Disaster alerts require live weather data.', source: 'Weather API', dataType: 'unavailable' } });
    }
    const alerts = disasterAlerts(weather);
    res.json({ success: true, data: { alerts, unavailable: false, source: 'Weather API (OpenWeather)', dataType: 'live', location: weather.location, lastUpdated: weather.lastUpdated } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Disaster monitoring failed.', error: e.message });
  }
};

exports.history = async (req, res) => {
  const data = await RiskAssessment.find({ user: req.user.id }).sort('-createdAt').limit(50);
  res.json({ success: true, data });
};
