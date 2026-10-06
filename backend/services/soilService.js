// Rule-based soil health analysis
function analyzeSoil({ ph, nitrogen, phosphorus, potassium, moisture, soilType, temperature }) {
  const recs = [];
  let score = 0;

  let phCondition = 'Poor';
  if (ph >= 6 && ph <= 7.5) { phCondition = 'Good'; score += 25; }
  else if (ph >= 5.5 && ph < 6 || ph > 7.5 && ph <= 8) { phCondition = 'Moderate'; score += 15; }
  else if (ph >= 5 && ph <= 9) { phCondition = 'Moderate'; score += 8; }
  if (ph < 5.5) recs.push('Apply agricultural lime to raise pH.');
  if (ph > 7.5) recs.push('Add organic matter or gypsum to reduce alkalinity.');

  let nitrogenStatus = nitrogen >= 40 ? 'Good' : nitrogen >= 20 ? 'Moderate' : 'Low';
  let phosphorusStatus = phosphorus >= 30 ? 'Good' : phosphorus >= 15 ? 'Moderate' : 'Low';
  let potassiumStatus = potassium >= 40 ? 'Good' : potassium >= 20 ? 'Moderate' : 'Low';
  score += nitrogenStatus === 'Good' ? 20 : nitrogenStatus === 'Moderate' ? 12 : 5;
  score += phosphorusStatus === 'Good' ? 18 : phosphorusStatus === 'Moderate' ? 11 : 5;
  score += potassiumStatus === 'Good' ? 17 : potassiumStatus === 'Moderate' ? 10 : 4;
  if (nitrogenStatus !== 'Good') recs.push('Apply urea or organic compost to boost nitrogen.');
  if (phosphorusStatus !== 'Good') recs.push('Use single super phosphate for phosphorus deficiency.');
  if (potassiumStatus !== 'Good') recs.push('Apply muriate of potash to correct potassium.');

  let moistureStatus = moisture >= 30 && moisture <= 60 ? 'Good' : moisture >= 20 && moisture <= 70 ? 'Moderate' : 'Poor';
  score += moistureStatus === 'Good' ? 15 : moistureStatus === 'Moderate' ? 9 : 4;
  if (moisture < 20) recs.push('Increase irrigation frequency and add mulch.');
  if (moisture > 70) recs.push('Improve drainage to avoid waterlogging.');

  if (temperature >= 20 && temperature <= 32) score += 5; else score += 2;

  const suitableCrops = [];
  if (ph >= 5.5 && ph <= 7.5 && moisture >= 25) suitableCrops.push('Rice', 'Maize');
  if (ph >= 6 && ph <= 8 && potassiumStatus !== 'Low') suitableCrops.push('Cotton', 'Groundnut');
  if (ph >= 5.8 && ph <= 7.2) suitableCrops.push('Chickpea', 'Soybean');
  if (!suitableCrops.length) suitableCrops.push('Mustard', 'Sorghum');

  if (!recs.length) recs.push('Soil is in good condition. Maintain current practices.');

  return { score: Math.min(100, Math.round(score)), phCondition, nitrogenStatus, phosphorusStatus, potassiumStatus, moistureStatus, suitableCrops: [...new Set(suitableCrops)].slice(0, 5), recommendations: recs };
}
module.exports = { analyzeSoil };
