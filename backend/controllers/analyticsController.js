const Farm = require('../models/Farm');
const CropScan = require('../models/CropScan');
const PestScan = require('../models/PestScan');
const SoilAnalysis = require('../models/SoilAnalysis');
const IrrigationRecord = require('../models/IrrigationRecord');
const ProfitCalculation = require('../models/ProfitCalculation');
const RiskAssessment = require('../models/RiskAssessment');
const WeatherRecord = require('../models/WeatherRecord');

const DAY = 86400000;
const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

function userScope(userId, farmId) {
  return farmId && farmId !== 'all' ? { user: userId, farm: farmId } : { user: userId };
}

// GET /api/analytics/dashboard/:farmId  (farmId or "all")
exports.dashboard = async (req, res) => {
  try {
    const { farmId } = req.params;
    const scope = userScope(req.user.id, farmId);
    const [scans, pests, soils, irrigations, profits, risks, weathers, farms] = await Promise.all([
      CropScan.find(scope).sort('createdAt').limit(100),
      PestScan.find(scope).sort('createdAt').limit(100),
      SoilAnalysis.find(scope).sort('createdAt').limit(100),
      IrrigationRecord.find(scope).sort('createdAt').limit(100),
      ProfitCalculation.find(scope).sort('createdAt').limit(100),
      RiskAssessment.find({ user: req.user.id, ...(farmId && farmId !== 'all' ? { farm: farmId } : {}) }).sort('createdAt').limit(100),
      WeatherRecord.find({ user: req.user.id }).sort('createdAt').limit(100),
      Farm.find({ user: req.user.id }),
    ]);

    const cropHealth = scans.map(s => ({
      date: dateKey(s.createdAt),
      crop: s.crop,
      value: s.risk === 'HIGH' ? 45 : s.risk === 'MEDIUM' ? 70 : 92,
      disease: s.disease,
    }));
    const soilTrend = soils.map(s => ({ date: dateKey(s.createdAt), score: s.score, ph: s.ph, nitrogen: s.nitrogen, phosphorus: s.phosphorus, potassium: s.potassium }));
    const irrigationTrend = irrigations.map(i => ({ date: dateKey(i.createdAt), soilMoisture: i.soilMoisture, temperature: i.temperature, rainProbability: i.rainProbability }));
    const profitTrend = profits.map(p => ({ date: dateKey(p.createdAt), investment: Math.round(p.totalInvestment), revenue: Math.round(p.expectedRevenue), profit: Math.round(p.estimatedProfit) }));
    const riskTrend = risks.map(r => ({ date: dateKey(r.createdAt), overall: r.overallRisk, weather: r.weatherRisk, disease: r.diseaseRisk, pest: r.pestRisk, water: r.waterRisk }));
    const weatherTrend = weathers.map(w => ({ date: dateKey(w.createdAt), temperature: w.temperature, humidity: w.humidity, rainProbability: w.rainProbability }));

    const diseaseCounts = {};
    scans.forEach(s => { if (s.disease && s.disease !== 'Healthy') diseaseCounts[s.disease] = (diseaseCounts[s.disease] || 0) + 1; });
    const pestCounts = {};
    pests.forEach(p => { if (p.pest && !/no significant/i.test(p.pest)) pestCounts[p.pest] = (pestCounts[p.pest] || 0) + 1; });

    const totalArea = farms.reduce((s, f) => s + (f.unit === 'hectares' ? f.area * 2.471 : f.area), 0);
    const latestProfit = profits[profits.length - 1];

    const farmHealthScore = (() => {
      const parts = [];
      if (scans.length) parts.push(scans.reduce((a, s) => a + (s.risk === 'HIGH' ? 45 : s.risk === 'MEDIUM' ? 70 : 92), 0) / scans.length);
      if (soils.length) parts.push(soils[soils.length - 1].score);
      if (risks.length) {
        const r = risks[risks.length - 1];
        const map = { LOW: 90, MODERATE: 65, HIGH: 40, CRITICAL: 20 };
        parts.push((map[r.overallRisk] ?? 60));
      }
      return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;
    })();

    res.json({
      success: true,
      data: {
        farmId: farmId || 'all',
        farmCount: farms.length, totalArea: Math.round(totalArea * 10) / 10,
        cropHealth, soilHealth: soilTrend, irrigation: irrigationTrend,
        profit: profitTrend, risk: riskTrend, weather: weatherTrend,
        diseaseDetections: Object.entries(diseaseCounts).map(([name, count]) => ({ name, count })),
        pestDetections: Object.entries(pestCounts).map(([name, count]) => ({ name, count })),
        farmHealthScore,
        totals: {
          scans: scans.length, pestScans: pests.length, soilAnalyses: soils.length,
          irrigations: irrigations.length, calculations: profits.length,
          totalProfit: Math.round(profits.reduce((a, p) => a + p.estimatedProfit, 0)),
          totalRevenue: Math.round(profits.reduce((a, p) => a + p.expectedRevenue, 0)),
          totalInvestment: Math.round(profits.reduce((a, p) => a + p.totalInvestment, 0)),
          latestProfit: latestProfit ? Math.round(latestProfit.estimatedProfit) : null,
        },
        dataType: 'database',
        source: 'MongoDB farm records',
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Analytics failed.', error: e.message });
  }
};

// GET /api/analytics/:farmId — alias
exports.farmAnalytics = exports.dashboard;
