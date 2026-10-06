const Notification = require('../models/Notification');
const { getWeather } = require('../services/weatherService');
const { irrigationDecision } = require('../services/irrigationService');

// POST /api/irrigation/analyze
exports.analyze = async (req, res) => {
  try {
    const b = req.body;
    if (b.soilMoisture === undefined || b.temperature === undefined || b.rainProbability === undefined) {
      return res.status(400).json({ success: false, message: 'Soil moisture, temperature and rain probability are required.' });
    }

    // Enrich with live weather for the farm location when available
    let weatherSource = 'User input';
    let weatherAvailable = false;
    if (b.farm) {
      try {
        const farm = await require('../models/Farm').findOne({ _id: b.farm, user: req.user.id });
        const w = await getWeather({ lat: farm?.latitude ?? undefined, lon: farm?.longitude ?? undefined, location: farm ? `${farm.district || ''}, ${farm.state || ''}` : undefined });
        if (w && !w.unavailable) {
          b.rainProbability = w.rainProbability;
          b.temperature = w.temperature;
          b.humidity = w.humidity;
          weatherSource = `LIVE DATA — ${w.source}`;
          weatherAvailable = true;
        }
      } catch {}
    }

    const { decision, reason, factors } = irrigationDecision({
      crop: b.crop, soilMoisture: Number(b.soilMoisture), temperature: Number(b.temperature),
      humidity: Number(b.humidity) || 50, rainProbability: Number(b.rainProbability),
      lastIrrigationHours: Number(b.lastIrrigationHours) || 24, growthStage: b.growthStage || 'vegetative',
    });

    // Estimated water: ~3500 L/acre for a light irrigation session, scaled by need
    const area = Number(b.farmArea) || 1;
    const waterLitres = decision === 'NO_IRRIGATION_REQUIRED' ? 0 : Math.round(area * 3500 * (decision === 'IRRIGATION_REQUIRED_NOW' ? 1 : 0.6));

    const record = await require('../models/IrrigationRecord').create({
      user: req.user.id, farm: b.farm || undefined, crop: b.crop,
      soilMoisture: Number(b.soilMoisture), temperature: Number(b.temperature),
      humidity: Number(b.humidity) || 50, rainProbability: Number(b.rainProbability),
      lastIrrigationHours: Number(b.lastIrrigationHours) || 24, growthStage: b.growthStage,
      decision, reason,
    });

    if (decision === 'IRRIGATION_REQUIRED_NOW' && req.user) {
      const recent = await Notification.findOne({ user: req.user.id, type: 'irrigation', createdAt: { $gte: new Date(Date.now() - 6 * 3600000) } });
      if (!recent) {
        await Notification.create({ user: req.user.id, title: 'Irrigation Due', message: `Soil moisture is ${b.soilMoisture}%. Irrigation required now for ${b.crop}.`, type: 'irrigation', read: false });
      }
    }

    const nextCheckHours = decision === 'IRRIGATION_REQUIRED_NOW' ? 2 : decision === 'IRRIGATE_WITHIN_6_HOURS' ? 6 : decision === 'IRRIGATE_WITHIN_24_HOURS' ? 24 : 48;

    res.json({
      success: true,
      data: {
        ...record.toObject(), factors, decision, reason,
        waterLitres, weatherSource, weatherAvailable,
        nextCheck: `Re-check soil moisture in ~${nextCheckHours} hours.`,
        source: weatherAvailable ? 'Calculated from live weather + user inputs' : 'Calculated from user inputs',
        dataType: 'calculated',
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Irrigation analysis failed.', error: e.message });
  }
};

// GET /api/irrigation — history
exports.history = async (req, res) => {
  const data = await require('../models/IrrigationRecord').find({ user: req.user.id }).sort('-createdAt');
  res.json({ success: true, data });
};
