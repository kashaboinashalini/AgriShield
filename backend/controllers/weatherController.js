const Notification = require('../models/Notification');
const WeatherRecord = require('../models/WeatherRecord');
const Farm = require('../models/Farm');
const { getWeather } = require('../services/weatherService');

async function resolveFarm(req) {
  const id = req.params.farmId || req.query.farm;
  if (!id) return null;
  return Farm.findOne({ _id: id, user: req.user.id });
}

async function fetchWeather(req) {
  const farm = await resolveFarm(req);
  const lat = farm?.latitude ?? (req.query.lat ? Number(req.query.lat) : undefined);
  const lon = farm?.longitude ?? (req.query.lon ? Number(req.query.lon) : undefined);
  const location = farm
    ? `${farm.village || ''}, ${farm.district || ''}, ${farm.state || ''}`.replace(/^,\s*|,\s*$/g, '')
    : (req.query.location || req.query.district || undefined);
  return getWeather({ lat, lon, location });
}

async function persistRecord(user, w) {
  try {
    await WeatherRecord.create({
      user: user.id, location: w.location, temperature: w.temperature, humidity: w.humidity,
      rainProbability: w.rainProbability, windSpeed: w.windSpeed, condition: w.condition,
      forecast: w.forecast, recommendations: w.recommendations, demo: false,
    });
  } catch {}
}

async function maybeAlert(user, w) {
  if ((w.rainProbability || 0) > 70) {
    const recent = await Notification.findOne({ user: user.id, type: 'weather', createdAt: { $gte: new Date(Date.now() - 6 * 3600000) } });
    if (!recent) {
      await Notification.create({
        user: user.id, title: 'Heavy Rainfall Alert',
        message: `${w.rainProbability}% rain probability expected in ${w.location}. Avoid irrigation, check drainage, protect harvested crops.`,
        type: 'weather', read: false,
      });
    }
  }
}

exports.current = async (req, res) => {
  try {
    const w = await fetchWeather(req);
    if (w.unavailable) return res.status(503).json({ success: false, ...w });
    if (req.user) { await persistRecord(req.user, w); await maybeAlert(req.user, w); }
    res.json({ success: true, data: w });
  } catch (e) {
    res.status(503).json({ success: false, unavailable: true, source: 'OpenWeather', dataType: 'unavailable', message: 'Live weather data is temporarily unavailable. Please try again.' });
  }
};

exports.forecast = async (req, res) => {
  try {
    const w = await fetchWeather(req);
    if (w.unavailable) return res.status(503).json({ success: false, ...w });
    if (req.user) { await persistRecord(req.user, w); await maybeAlert(req.user, w); }
    res.json({ success: true, data: { location: w.location, forecast: w.forecast, recommendations: w.recommendations, source: w.source, dataType: w.dataType, lastUpdated: w.lastUpdated } });
  } catch (e) {
    res.status(503).json({ success: false, unavailable: true, source: 'OpenWeather', dataType: 'unavailable', message: 'Live weather data is temporarily unavailable. Please try again.' });
  }
};
