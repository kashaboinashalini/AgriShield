// Crop recommendation scoring engine
const CROPS = [
  { name: 'Rice', soils: ['Alluvial', 'Black Soil', 'Clay', 'Red Soil', 'Loamy'], ph: [5.5, 7.5], duration: 130, water: 'High (1200-1500 mm)', yield: 28, profit: 45000, temp: [21, 37], rainfall: [100, 200], season: ['Kharif', 'Rabi'] },
  { name: 'Maize', soils: ['Alluvial', 'Red Soil', 'Black Soil', 'Loamy', 'Sandy Loam'], ph: [5.5, 7.5], duration: 110, water: 'Moderate (600-800 mm)', yield: 24, profit: 38000, temp: [18, 32], rainfall: [60, 120], season: ['Kharif', 'Rabi', 'Zaid'] },
  { name: 'Groundnut', soils: ['Sandy Loam', 'Red Soil', 'Black Soil', 'Alluvial'], ph: [6, 7.5], duration: 105, water: 'Low-Moderate (500-700 mm)', yield: 12, profit: 42000, temp: [20, 30], rainfall: [50, 100], season: ['Kharif', 'Rabi'] },
  { name: 'Cotton', soils: ['Black Soil', 'Alluvial', 'Red Soil'], ph: [6, 8], duration: 160, water: 'Moderate (700-900 mm)', yield: 10, profit: 52000, temp: [21, 37], rainfall: [50, 100], season: ['Kharif'] },
  { name: 'Wheat', soils: ['Alluvial', 'Loamy', 'Black Soil'], ph: [6, 7.5], duration: 120, water: 'Moderate (450-650 mm)', yield: 22, profit: 40000, temp: [12, 25], rainfall: [30, 75], season: ['Rabi'] },
  { name: 'Chickpea', soils: ['Black Soil', 'Alluvial', 'Loamy'], ph: [6, 8], duration: 100, water: 'Low (300-400 mm)', yield: 10, profit: 36000, temp: [10, 29], rainfall: [20, 50], season: ['Rabi'] },
  { name: 'Soybean', soils: ['Black Soil', 'Red Soil', 'Alluvial'], ph: [6, 7.5], duration: 100, water: 'Moderate (600-900 mm)', yield: 12, profit: 34000, temp: [20, 30], rainfall: [70, 120], season: ['Kharif'] },
  { name: 'Sugarcane', soils: ['Alluvial', 'Black Soil', 'Loamy'], ph: [6, 7.5], duration: 365, water: 'Very High (1500-2500 mm)', yield: 320, profit: 60000, temp: [20, 38], rainfall: [100, 180], season: ['Kharif'] },
];

function recommendCrops({ soilType, ph, nitrogen, phosphorus, potassium, waterAvailability, temperature, rainfall, season }) {
  const scored = CROPS.map(c => {
    let s = 0;
    if (c.soils.some(x => x.toLowerCase() === String(soilType || '').toLowerCase())) s += 30; else s += 8;
    if (ph >= c.ph[0] && ph <= c.ph[1]) s += 20; else s += Math.max(0, 15 - Math.abs(ph - (c.ph[0] + c.ph[1]) / 2) * 4);
    if (temperature >= c.temp[0] && temperature <= c.temp[1]) s += 15; else s += 4;
    if (rainfall >= c.rainfall[0] && rainfall <= c.rainfall[1] * 2) s += 10; else s += 3;
    if (season && c.season.includes(season)) s += 10; else s += 3;
    const waterOk = waterAvailability === 'High' ? ['High', 'Very High', 'Moderate', 'Low-Moderate', 'Low'].some(w => c.water.includes(w)) : waterAvailability === 'Low' ? c.water.toLowerCase().includes('low') : true;
    s += waterOk ? 10 : 2;
    const npk = (nitrogen / 50 + phosphorus / 40 + potassium / 50) / 3;
    s += Math.round(Math.min(1, Math.max(0.3, npk)) * 5);
    return { ...c, suitability: Math.min(98, Math.round(s)) };
  });
  return scored.sort((a, b) => b.suitability - a.suitability).slice(0, 3);
}
module.exports = { recommendCrops, CROPS };
