// Farm risk engine — transparent rule-based scoring from real inputs.
// Weather inputs come from the live weather service when available;
// otherwise weather-derived risks are marked as estimated from farm records.

const rank = { LOW: 0, MODERATE: 1, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
const level = (v) => (v >= 2.6 ? 'CRITICAL' : v >= 1.6 ? 'HIGH' : v >= 0.8 ? 'MODERATE' : 'LOW');

function weatherRiskFrom(w) {
  let score = 0;
  const reasons = [];
  if (w.rainProbability > 75) { score += 2; reasons.push(`very high rain probability (${w.rainProbability}%)`); }
  else if (w.rainProbability > 50) { score += 1; reasons.push(`rain probability ${w.rainProbability}%`);
  } else if (w.rainProbability > 20) score += 0.4;
  if (w.temperature > 38) { score += 2; reasons.push(`extreme heat (${w.temperature}°C)`); }
  else if (w.temperature > 33) { score += 1; reasons.push(`high temperature (${w.temperature}°C)`); }
  else if (w.temperature < 8) { score += 1; reasons.push(`low temperature (${w.temperature}°C)`); }
  if (w.windSpeed > 40) { score += 2; reasons.push(`storm-force winds (${w.windSpeed} km/h)`); }
  else if (w.windSpeed > 28) { score += 1; reasons.push(`strong winds (${w.windSpeed} km/h)`); }
  if (w.humidity > 85) { score += 0.6; reasons.push(`very high humidity (${w.humidity}%)`); }
  return { risk: level(score), score, reason: reasons.length ? reasons.join('; ') : 'Stable weather conditions' };
}

function computeRisks({ latestScan, latestPest, soil, irrigation, weather, crop, growthStage }) {
  // --- Disease risk from latest crop scan ---
  let disease;
  if (latestScan && latestScan.disease && latestScan.disease !== 'Healthy') {
    const s = rank[latestScan.risk === 'HIGH' ? 'HIGH' : latestScan.risk === 'MEDIUM' ? 'MODERATE' : 'LOW'];
    disease = { risk: level(s + 0.6), reason: `${latestScan.disease} detected on ${latestScan.crop} (${latestScan.confidence}% confidence, ${latestScan.severity} severity) in latest scan` };
  } else if (latestScan) {
    disease = { risk: 'LOW', reason: `Latest scan (${latestScan.crop}) shows no disease` };
  } else {
    disease = { risk: 'MODERATE', reason: 'No recent crop scan — disease risk unknown. Upload a leaf image to evaluate.' };
  }
  if (weather && weather.humidity > 80 && disease.risk === 'LOW') disease = { risk: 'MODERATE', reason: `High humidity (${weather.humidity}%) may increase disease pressure` };

  // --- Pest risk from latest pest scan ---
  let pest;
  if (latestPest && latestPest.pest && !/no significant/i.test(latestPest.pest)) {
    const s = rank[latestPest.damageLevel === 'High' ? 'HIGH' : latestPest.damageLevel === 'Moderate' ? 'MODERATE' : 'LOW'];
    pest = { risk: level(s + 0.4), reason: `${latestPest.pest} detected on ${latestPest.crop} (${latestPest.confidence}% confidence, ${latestPest.damageLevel} damage)` };
  } else if (latestPest) {
    pest = { risk: 'LOW', reason: 'Latest pest scan shows no significant pest' };
  } else {
    pest = { risk: 'MODERATE', reason: 'No recent pest scan — run a pest detection scan for assessment' };
  }

  // --- Weather risk ---
  let weatherR;
  if (weather) {
    weatherR = weatherRiskFrom(weather);
  } else {
    weatherR = { risk: 'MODERATE', reason: 'Live weather unavailable — weather risk estimated from recent farm records' };
  }

  // --- Water risk from latest irrigation analysis ---
  let water;
  if (irrigation) {
    if (irrigation.decision === 'IRRIGATION_REQUIRED_NOW') water = { risk: 'HIGH', reason: irrigation.reason };
    else if (irrigation.decision === 'IRRIGATE_WITHIN_6_HOURS') water = { risk: 'MODERATE', reason: irrigation.reason };
    else water = { risk: 'LOW', reason: irrigation.reason };
  } else {
    water = { risk: 'MODERATE', reason: 'No irrigation analysis recorded — run the Irrigation Advisor' };
  }

  // --- Soil risk ---
  let soilR;
  if (soil) {
    if (soil.score >= 75) soilR = { risk: 'LOW', reason: `Soil health score ${soil.score}/100` };
    else if (soil.score >= 50) soilR = { risk: 'MODERATE', reason: `Soil health score ${soil.score}/100 — nutrients need attention` };
    else soilR = { risk: 'HIGH', reason: `Soil health score ${soil.score}/100 — corrective action needed` };
  } else {
    soilR = { risk: 'MODERATE', reason: 'No soil analysis recorded' };
  }

  const scores = [disease, pest, weatherR, water, soilR].map(r => rank[r.risk] ?? 1);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const overallRisk = level(avg);

  const actions = [];
  if (disease.risk !== 'LOW') actions.push('Scout crops for disease symptoms and treat promptly if confirmed.');
  if (pest.risk !== 'LOW') actions.push('Check traps and field edges for pest activity.');
  if (weatherR.risk === 'HIGH' || weatherR.risk === 'CRITICAL') actions.push('Postpone chemical spraying and prepare for adverse weather.');
  if (water.risk === 'HIGH') actions.push('Schedule irrigation within the next few hours.');
  if (soilR.risk === 'HIGH') actions.push('Apply corrective fertilizer based on the latest soil analysis.');
  if (!actions.length) actions.push('Farm conditions are stable — continue routine monitoring.');

  return {
    overallRisk,
    weatherRisk: weatherR.risk, diseaseRisk: disease.risk, pestRisk: pest.risk, waterRisk: water.risk, soilRisk: soilR.risk,
    reasons: { weather: weatherR.reason, disease: disease.reason, pest: pest.reason, water: water.reason, soil: soilR.reason },
    actions,
  };
}

module.exports = { computeRisks, weatherRiskFrom };
