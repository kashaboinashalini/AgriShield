const Farm = require('../models/Farm');
const CropScan = require('../models/CropScan');
const SoilAnalysis = require('../models/SoilAnalysis');
const IrrigationRecord = require('../models/IrrigationRecord');
const ProfitCalculation = require('../models/ProfitCalculation');
const WeatherRecord = require('../models/WeatherRecord');
const Notification = require('../models/Notification');
const FarmTask = require('../models/FarmTask');
const RiskAssessment = require('../models/RiskAssessment');
const { getWeather } = require('../services/weatherService');
const { computeRisks } = require('../services/riskService');

// GET /api/dashboard — real-time dashboard computed from MongoDB + live weather
exports.dashboard = async (req, res) => {
  try {
    const [farms, user, latestScan, latestSoil, latestIrrigation, profit, scans, notifications, tasks, risks, weatherRecords] = await Promise.all([
      Farm.find({ user: req.user.id }).sort('-createdAt'),
      require('../models/User').findById(req.user.id),
      CropScan.findOne({ user: req.user.id }).sort('-createdAt'),
      SoilAnalysis.findOne({ user: req.user.id }).sort('-createdAt'),
      IrrigationRecord.findOne({ user: req.user.id }).sort('-createdAt'),
      ProfitCalculation.findOne({ user: req.user.id }).sort('-createdAt'),
      CropScan.countDocuments({ user: req.user.id }),
      Notification.find({ user: req.user.id }).sort('-createdAt').limit(5),
      FarmTask.find({ user: req.user.id, status: { $ne: 'completed' } }).sort('dueDate').limit(5),
      RiskAssessment.findOne({ user: req.user.id }).sort('-createdAt'),
      WeatherRecord.find({ user: req.user.id }).sort('-createdAt').limit(1),
    ]);

    const activeFarm = user?.activeFarm ? farms.find(f => String(f._id) === String(user.activeFarm)) : farms[0];

    let weatherRes = null;
    if (activeFarm) {
      try {
        weatherRes = await getWeather({
          lat: activeFarm.latitude ?? undefined,
          lon: activeFarm.longitude ?? undefined,
          location: activeFarm.district ? `${activeFarm.village || ''}, ${activeFarm.district}, ${activeFarm.state || ''}`.replace(/^,\s*|,\s*$/g, '') : undefined,
        });
      } catch { weatherRes = null; }
    }
    const weather = weatherRes && !weatherRes.unavailable ? weatherRes : null;
    const weatherUnavailable = weatherRes ? weatherRes.unavailable : true;

    const risksComputed = computeRisks({ latestScan, latestPest: null, soil: latestSoil, irrigation: latestIrrigation, weather });

    // Crop health strictly from the latest scan (no static numbers)
    const cropHealth = latestScan
      ? (latestScan.risk === 'HIGH' ? 45 : latestScan.risk === 'MEDIUM' ? 70 : 92)
      : null;
    const cropHealthLabel = latestScan
      ? (latestScan.risk === 'HIGH' ? 'Poor' : latestScan.risk === 'MEDIUM' ? 'Moderate' : 'Good')
      : 'No data';

    const farmArea = farms.reduce((s, f) => s + (f.unit === 'hectares' ? f.area * 2.471 : f.area), 0);

    const now = Date.now();
    const ago = (d) => {
      const s = Math.max(1, Math.round((now - new Date(d).getTime()) / 1000));
      if (s < 60) return `${s}s ago`;
      if (s < 3600) return `${Math.round(s / 60)} min ago`;
      if (s < 86400) return `${Math.round(s / 3600)} h ago`;
      return `${Math.round(s / 86400)} d ago`;
    };

    const recentActivities = [
      ...(latestScan ? [{ id: latestScan._id, type: 'scan', text: `Crop scan: ${latestScan.crop} — ${latestScan.disease} (${latestScan.confidence}%)`, date: latestScan.createdAt }] : []),
      ...(latestSoil ? [{ id: latestSoil._id, type: 'soil', text: `Soil analysis: score ${latestSoil.score}/100`, date: latestSoil.createdAt }] : []),
      ...(latestIrrigation ? [{ id: latestIrrigation._id, type: 'irrigation', text: `Irrigation analysis: ${latestIrrigation.decision.replace(/_/g, ' ').toLowerCase()}`, date: latestIrrigation.createdAt }] : []),
      ...(profit ? [{ id: profit._id, type: 'profit', text: `Profit calculation: ₹${Math.round(profit.estimatedProfit).toLocaleString('en-IN')} estimated`, date: profit.createdAt }] : []),
      ...tasks.slice(0, 2).map(t => ({ id: t._id, type: 'task', text: `Upcoming: ${t.title} (${new Date(t.dueDate).toLocaleDateString('en-IN')})`, date: t.dueDate })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

    res.json({
      success: true,
      data: {
        farmCount: farms.length,
        farmArea: Math.round(farmArea * 10) / 10,
        activeFarm: activeFarm ? { id: activeFarm._id, name: activeFarm.farmName, village: activeFarm.village, district: activeFarm.district, state: activeFarm.state, area: activeFarm.area, unit: activeFarm.unit, crop: activeFarm.currentCrop } : null,
        cropHealth, cropHealthLabel,
        cropHealthSource: latestScan ? 'Database — latest crop scan' : 'No crop scan yet',
        diseaseRisk: risksComputed.diseaseRisk,
        diseaseRiskReason: risksComputed.reasons.disease,
        soilHealth: latestSoil ? `${latestSoil.score}/100 (${latestSoil.score >= 75 ? 'Good' : latestSoil.score >= 50 ? 'Moderate' : 'Poor'})` : 'No data',
        soilScore: latestSoil ? latestSoil.score : null,
        soilSource: latestSoil ? 'Database — latest soil analysis' : 'No soil analysis yet',
        waterStatus: latestIrrigation ? latestIrrigation.decision.replace(/_/g, ' ') : 'No data',
        waterSource: latestIrrigation ? 'Database — latest irrigation analysis' : 'No irrigation record yet',
        weatherRisk: risksComputed.weatherRisk,
        weatherRiskReason: risksComputed.reasons.weather,
        estimatedProfit: profit ? Math.round(profit.estimatedProfit) : null,
        profitSource: profit ? 'Database — latest profit calculation' : 'No profit calculation yet',
        overallRisk: risksComputed.overallRisk,
        riskActions: risksComputed.actions,
        totalScans: scans,
        weather,
        weatherUnavailable,
        weatherSource: weather ? `LIVE DATA — ${weather.source}` : 'Weather API unavailable',
        weatherUpdated: weather ? weather.lastUpdated : null,
        lastWeatherRecord: weatherRecords[0] ? { condition: weatherRecords[0].condition, temperature: weatherRecords[0].temperature, date: weatherRecords[0].createdAt } : null,
        recentActivities: recentActivities.map(a => ({ ...a.toObject ? a.toObject() : a, ago: ago(a.date) })),
        notifications: notifications.map(n => ({ id: n._id, title: n.title, message: n.message, type: n.type, read: n.read, ago: ago(n.createdAt) })),
        unreadNotifications: notifications.filter(n => !n.read).length,
        upcomingTasks: tasks.map(t => ({ id: t._id, title: t.title, dueDate: t.dueDate, priority: t.priority, crop: t.crop })),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Dashboard failed to load.', error: e.message });
  }
};
