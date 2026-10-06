// Smart irrigation decision engine with transparent factor breakdown
function irrigationDecision({ crop, soilMoisture, temperature, humidity, rainProbability, lastIrrigationHours, growthStage }) {
  const factors = [];
  let score = 0;
  if (soilMoisture < 20) { score += 40; factors.push(`Soil moisture is critically low (${soilMoisture}%)`); }
  else if (soilMoisture < 35) { score += 25; factors.push(`Soil moisture is low (${soilMoisture}%)`); }
  else if (soilMoisture < 50) { score += 10; factors.push(`Soil moisture is moderate (${soilMoisture}%)`); }
  else factors.push(`Soil moisture is adequate (${soilMoisture}%)`);

  if (temperature > 35) { score += 20; factors.push(`High temperature ${temperature}°C increases water demand`); }
  else if (temperature > 30) { score += 10; factors.push(`Temperature ${temperature}°C`); }

  if (humidity < 30) { score += 10; factors.push(`Low humidity (${humidity}%) increases evaporation`); }

  if (rainProbability > 60) { score -= 50; factors.push(`Rain likely (${rainProbability}%) — watering can be skipped`); }
  else if (rainProbability > 30) { score -= 25; factors.push(`Some rain chance (${rainProbability}%)`); }
  else if (rainProbability < 15) { score += 10; factors.push(`Very low rain probability (${rainProbability}%)`); }

  if (lastIrrigationHours > 48) { score += 15; factors.push(`Last irrigation was ${lastIrrigationHours} hours ago`); }
  else if (lastIrrigationHours > 24) { score += 8; factors.push(`Last irrigation was ${lastIrrigationHours} hours ago`); }

  if (['flowering', 'fruiting', 'heading'].includes(String(growthStage).toLowerCase())) { score += 10; factors.push(`${growthStage} stage is water-sensitive`); }

  let decision, reason;
  if (score >= 55) { decision = 'IRRIGATION_REQUIRED_NOW'; reason = `Soil moisture is ${soilMoisture}% and rainfall probability is only ${rainProbability}%. Immediate irrigation is strongly recommended, particularly at the ${growthStage} stage.`; }
  else if (score >= 30) { decision = 'IRRIGATE_WITHIN_6_HOURS'; reason = `Soil moisture is low (${soilMoisture}%) and temperature is ${temperature}°C. Irrigate within the next 4-6 hours to avoid stress.`; }
  else if (score >= 10) { decision = 'IRRIGATE_WITHIN_24_HOURS'; reason = 'Moderate need. Monitor soil moisture; light irrigation within 24 hours will be sufficient.'; }
  else { decision = 'NO_IRRIGATION_REQUIRED'; reason = `Soil moisture is ${soilMoisture}% and ${rainProbability > 40 ? `rain is likely (${rainProbability}% probability)` : 'conditions are stable'}. Watering now could cause waterlogging.`; }
  return { decision, reason, factors, score };
}
module.exports = { irrigationDecision };
