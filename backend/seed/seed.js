const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const CropScan = require('../models/CropScan');
const PestScan = require('../models/PestScan');
const SoilAnalysis = require('../models/SoilAnalysis');
const IrrigationRecord = require('../models/IrrigationRecord');
const WeatherRecord = require('../models/WeatherRecord');
const MarketPrice = require('../models/MarketPrice');
const ProfitCalculation = require('../models/ProfitCalculation');
const FarmTask = require('../models/FarmTask');
const ChatMessage = require('../models/ChatMessage');
const GovernmentScheme = require('../models/GovernmentScheme');
const Notification = require('../models/Notification');
const RiskAssessment = require('../models/RiskAssessment');
const { CROPS } = require('../services/cropService');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrishield');
  console.log('Seeding...');

  await Promise.all([User.deleteMany({}), Farm.deleteMany({}), Crop.deleteMany({}), CropScan.deleteMany({}), PestScan.deleteMany({}), SoilAnalysis.deleteMany({}), IrrigationRecord.deleteMany({}), WeatherRecord.deleteMany({}), MarketPrice.deleteMany({}), ProfitCalculation.deleteMany({}), FarmTask.deleteMany({}), ChatMessage.deleteMany({}), GovernmentScheme.deleteMany({}), Notification.deleteMany({})]);

  // Demo farmer — authenticates through the normal login flow
  // Email: demo@agrishield.ai   Password: Demo@123
  const demo = await User.create({ fullName: 'Demo Farmer', mobile: '9999999999', email: 'demo@agrishield.ai', password: 'Demo@123', state: 'Telangana', district: 'Hyderabad', village: 'Demo Village', primaryCrop: 'Rice', farmSize: 3, soilType: 'Black Soil', role: 'farmer' });

  const farms = await Farm.insertMany([
    { user: demo._id, farmName: 'Krishna Fields', village: 'Demo Village', district: 'Hyderabad', state: 'Telangana', area: 3, unit: 'acres', soilType: 'Black Soil', irrigationType: 'Drip', waterAvailability: 'Borewell + Drip', currentCrop: 'Rice', season: 'Kharif', sowingDate: new Date(Date.now() - 40 * 86400000), latitude: 17.385, longitude: 78.4867 },
    { user: demo._id, farmName: 'Gondi Plot', village: 'Shamshabad', district: 'Hyderabad', state: 'Telangana', area: 5, unit: 'acres', soilType: 'Red Soil', irrigationType: 'Canal', waterAvailability: 'Canal', currentCrop: 'Maize', season: 'Kharif', sowingDate: new Date(Date.now() - 20 * 86400000), latitude: 17.24, longitude: 78.4 },
  ]);
  // Krishna Fields is the demo user's active farm
  await User.findByIdAndUpdate(demo._id, { activeFarm: farms[0]._id });

  await Crop.insertMany(CROPS.map(c => ({ name: c.name, season: c.season, durationDays: c.duration, waterRequirement: c.water, suitableSoils: c.soils, expectedYieldPerAcre: c.yield, estimatedProfitPerAcre: c.profit, requirements: c.water })));

  await CropScan.insertMany([
    { user: demo._id, farm: farms[0]._id, imagePath: '', crop: 'Rice', disease: 'Rice Leaf Blast', confidence: 94, severity: 'Moderate', risk: 'HIGH', symptoms: ['Diamond-shaped brown lesions on leaves', 'Lesions may coalesce and kill leaves'], recommendations: ['Apply tricyclazole fungicide', 'Drain the field periodically', 'Avoid excess nitrogen'], prevention: ['Use resistant varieties', 'Balanced fertilizer use', 'Crop rotation'], demo: true, createdAt: new Date(Date.now() - 3 * 86400000) },
    { user: demo._id, farm: farms[0]._id, imagePath: '', crop: 'Rice', disease: 'Bacterial Leaf Blight', confidence: 81, severity: 'Mild', risk: 'MEDIUM', symptoms: ['Yellowing and drying of leaf tips'], recommendations: ['Drain standing water', 'Avoid nitrogen overuse'], prevention: ['Use certified seed', 'Avoid field injuries'], demo: true, createdAt: new Date(Date.now() - 10 * 86400000) },
    { user: demo._id, farm: farms[1]._id, imagePath: '', crop: 'Maize', disease: 'Healthy', confidence: 90, severity: 'None', risk: 'LOW', symptoms: [], recommendations: ['Continue current practices'], prevention: ['Regular monitoring'], demo: true, createdAt: new Date(Date.now() - 6 * 86400000) },
  ]);

  await PestScan.insertMany([
    { user: demo._id, farm: farms[0]._id, crop: 'Rice', pest: 'Stem Borer', confidence: 88, damageLevel: 'Moderate', prevention: ['Use pheromone traps', 'Apply cartap hydrochloride'], action: 'Install pheromone traps and remove affected tillers.', demo: true },
    { user: demo._id, farm: farms[1]._id, crop: 'Maize', pest: 'Fall Armyworm', confidence: 76, damageLevel: 'High', prevention: ['Apply spinetoram', 'Destruction of egg masses'], action: 'Spray spinetoram at whorl stage.', demo: true },
  ]);

  await SoilAnalysis.insertMany([
    { user: demo._id, farm: farms[0]._id, ph: 6.8, nitrogen: 42, phosphorus: 28, potassium: 35, moisture: 48, soilType: 'Black Soil', temperature: 29, location: 'Hyderabad', score: 82, phCondition: 'Good', nitrogenStatus: 'Good', phosphorusStatus: 'Moderate', potassiumStatus: 'Moderate', moistureStatus: 'Good', suitableCrops: ['Rice', 'Cotton'], recommendations: ['Soil is in good condition.'], createdAt: new Date(Date.now() - 2 * 86400000) },
    { user: demo._id, farm: farms[1]._id, ph: 7.6, nitrogen: 25, phosphorus: 20, potassium: 18, moisture: 22, soilType: 'Red Soil', temperature: 31, location: 'Shamshabad', score: 58, phCondition: 'Moderate', nitrogenStatus: 'Moderate', phosphorusStatus: 'Moderate', potassiumStatus: 'Low', moistureStatus: 'Moderate', suitableCrops: ['Groundnut', 'Sorghum'], recommendations: ['Apply muriate of potash', 'Increase irrigation frequency'], createdAt: new Date(Date.now() - 8 * 86400000) },
  ]);

  await IrrigationRecord.insertMany([
    { user: demo._id, farm: farms[0]._id, crop: 'Rice', soilMoisture: 18, temperature: 34, humidity: 38, rainProbability: 12, lastIrrigationHours: 52, growthStage: 'flowering', decision: 'IRRIGATION_REQUIRED_NOW', reason: 'Soil moisture is low and rainfall probability is only 12%.', createdAt: new Date() },
    { user: demo._id, farm: farms[1]._id, crop: 'Maize', soilMoisture: 55, temperature: 27, humidity: 65, rainProbability: 70, lastIrrigationHours: 12, growthStage: 'vegetative', decision: 'NO_IRRIGATION_REQUIRED', reason: 'Soil moisture adequate and rain likely.', createdAt: new Date(Date.now() - 2 * 86400000) },
  ]);

  // Weather history — clearly labelled simulated reference records (seed data only;
  // live weather always comes from the OpenWeather API at runtime)
  await WeatherRecord.insertMany([0, 1, 2, 4, 6].map((d, i) => ({
    user: demo._id, location: 'Hyderabad', temperature: 28 + (i % 5), feelsLike: 30 + (i % 5),
    humidity: 55 + i * 4, rainProbability: 15 + i * 8, windSpeed: 8 + i * 2,
    condition: ['Partly cloudy', 'Light rain', 'Sunny', 'Overcast', 'Scattered showers'][i % 5],
    forecast: [], recommendations: ['Reference weather record from seed data.'],
    demo: true, createdAt: new Date(Date.now() - d * 86400000),
  })));

  // Market prices: last 30 days for crops
  const crops = ['Rice', 'Wheat', 'Maize', 'Groundnut', 'Cotton', 'Chickpea'];
  const basePrice = { Rice: 28, Wheat: 26, Maize: 22, Groundnut: 64, Cotton: 72, Chickpea: 55 };
  const docs = [];
  crops.forEach(c => {
    for (let d = 29; d >= 0; d--) {
      const drift = Math.sin(d / 4) * 3 + (Math.abs(Math.sin(d * 7 + c.length)) * 4);
      const price = Math.round((basePrice[c] + drift) * 100) / 100;
      docs.push({ crop: c, market: 'Hyderabad Mandi', state: 'Telangana', date: new Date(Date.now() - d * 86400000), pricePerKg: price, minimumPrice: Math.round((price - 3) * 100) / 100, maximumPrice: Math.round((price + 4) * 100) / 100 });
    }
  });
  await MarketPrice.insertMany(docs);

  await ProfitCalculation.insertMany([
    { user: demo._id, farmArea: 3, seedCost: 6000, fertilizerCost: 12000, labourCost: 18000, irrigationCost: 8000, pesticideCost: 5000, otherCost: 3000, expectedYield: 28, sellingPrice: 28, totalInvestment: 52000, expectedProduction: 84, expectedRevenue: 70560, estimatedProfit: 18560, profitMargin: 26, costPerAcre: 17333, revenuePerAcre: 23520, createdAt: new Date(Date.now() - 15 * 86400000) },
    { user: demo._id, farmArea: 5, seedCost: 9000, fertilizerCost: 14000, labourCost: 22000, irrigationCost: 10000, pesticideCost: 7000, otherCost: 4000, expectedYield: 24, sellingPrice: 22, totalInvestment: 66000, expectedProduction: 120, expectedRevenue: 79200, estimatedProfit: 13200, profitMargin: 17, costPerAcre: 13200, revenuePerAcre: 15840, createdAt: new Date(Date.now() - 5 * 86400000) },
  ]);

  const sowing = new Date(Date.now() - 40 * 86400000);
  const mk = (title, type, offset, status) => ({ user: demo._id, farm: farms[0]._id, crop: 'Rice', title, type, dueDate: new Date(sowing.getTime() + offset * 86400000), status });
  await FarmTask.insertMany([
    mk('Seed selection & treatment', 'seed', -7, 'completed'),
    mk('Land preparation', 'sowing', -3, 'completed'),
    mk('Sowing', 'sowing', 0, 'completed'),
    mk('First irrigation', 'irrigation', 2, 'completed'),
    mk('Basal fertilizer application', 'fertilizer', 3, 'completed'),
    mk('Pest monitoring', 'pest', 33, 'completed'),
    mk('Second fertilizer dose', 'fertilizer', 46, 'pending'),
    mk('Disease scouting', 'disease', 59, 'pending'),
    mk('Pest monitoring (flowering stage)', 'pest', 78, 'pending'),
    mk('Pre-harvest irrigation', 'irrigation', 104, 'pending'),
    mk('Harvesting', 'harvest', 130, 'pending'),
  ]);

  await ChatMessage.insertMany([
    { user: demo._id, role: 'user', message: 'How do I control rice leaf blast?', language: 'English' },
    { user: demo._id, role: 'assistant', message: 'Apply tricyclazole fungicide, drain the field, and avoid excess nitrogen.', language: 'English' },
    { user: demo._id, role: 'user', message: 'నీరు ఎప్పుడు పోయాలి?', language: 'తెలుగు' },
    { user: demo._id, role: 'assistant', message: 'మట్టి 10-15 సెం.మీ ఎండితే నీరు పోయండి. ఉదయం లేదా సాయంత్రం పూట పారించండి.', language: 'తెలుగు' },
  ]);

  await GovernmentScheme.insertMany([
    { name: 'PM-KISAN', description: 'Direct income support to all farmer families across India.', eligibility: 'Farmer families owning cultivable land (small, marginal and others). Excludes institutional landholders and income-tax payers.', benefits: '₹6,000 per year, transferred in three installments directly to bank account', state: 'All India', applicationInfo: 'Apply online at pmkisan.gov.in or at any Common Service Centre (CSC).', farmerType: 'All', crop: 'All', landSizeCriteria: 'All sizes', url: 'https://pmkisan.gov.in', lastVerified: new Date() },
    { name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)', description: 'Crop insurance covering yield losses from natural calamities, pests and diseases.', eligibility: 'Farmers growing notified crops in notified areas, including loanee and non-loanee farmers.', benefits: 'Sum insured on crop loss; premium only 1.5-2% (Kharif/Rabi) or 5% (commercial crops)', state: 'All India', applicationInfo: 'Apply through bank/CSC before sowing deadline at pmfby.gov.in.', farmerType: 'All', crop: 'Rice', landSizeCriteria: 'All sizes', url: 'https://pmfby.gov.in', lastVerified: new Date() },
    { name: 'Rythu Bandhu (Investment Support Scheme)', description: 'Telangana government investment support for agriculture and horticulture farmers.', eligibility: 'Landholding farmers in Telangana (patta/darshan holders).', benefits: '₹10,000 per acre per year (₹5,000 per acre per season)', state: 'Telangana', applicationInfo: 'Apply via MeeSeva or the nearest mandal agriculture office.', farmerType: 'All', crop: 'All', landSizeCriteria: 'All sizes', url: 'https://agri.telangana.gov.in', lastVerified: new Date() },
    { name: 'Soil Health Card Scheme', description: 'Soil testing and nutrient recommendations for every farmer.', eligibility: 'All farmers across India.', benefits: 'Free soil health card every 2 years with crop-wise fertilizer recommendations', state: 'All India', applicationInfo: 'Register at the local agriculture department or soil testing laboratory.', farmerType: 'All', crop: 'All', landSizeCriteria: 'All sizes', url: 'https://soilhealth.dac.gov.in', lastVerified: new Date() },
    { name: 'PM Krishi Sinchayee Yojana (PKSY)', description: 'Irrigation support, including micro-irrigation (drip/sprinkler) subsidies.', eligibility: 'Farmers installing micro-irrigation systems on their land.', benefits: 'Subsidy up to 55% (small/marginal) or 45% (others) on drip/sprinkler systems', state: 'All India', applicationInfo: 'Apply through the state horticulture/agriculture department portal.', farmerType: 'Small', crop: 'All', landSizeCriteria: 'Up to 5 acres preferred', url: 'https://agricoop.nic.in', lastVerified: new Date() },
  ]);

  await Notification.insertMany([
    { user: demo._id, title: 'Irrigation Due', message: 'Soil moisture low on Krishna Fields. Irrigation recommended within 6 hours.', type: 'irrigation', read: false },
    { user: demo._id, title: 'Weather Alert', message: 'Heavy rain expected tomorrow. Delay fertilizer application.', type: 'weather', read: false },
    { user: demo._id, title: 'Disease Risk', message: 'Rice Leaf Blast detected with 94% confidence.', type: 'disease', read: true },
    { user: demo._id, title: 'Task Reminder', message: 'Second fertilizer dose scheduled soon.', type: 'task', read: false },
  ]);

  await RiskAssessment.insertMany([
    { user: demo._id, farm: farms[0]._id, overallRisk: 'MODERATE', weatherRisk: 'LOW', diseaseRisk: 'HIGH', pestRisk: 'MODERATE', waterRisk: 'HIGH', soilRisk: 'LOW',
      reasons: {
        weather: 'Stable weather conditions',
        disease: 'Rice Leaf Blast detected on Rice (94% confidence, Moderate severity) in latest scan',
        pest: 'Stem Borer detected on Rice (88% confidence, Moderate damage)',
        water: 'Soil moisture is low and rainfall probability is only 12%. Immediate irrigation is strongly recommended.',
        soil: 'Soil health score 82/100',
      },
      actions: ['Scout crops for disease symptoms and treat promptly if confirmed.', 'Check traps and field edges for pest activity.', 'Schedule irrigation within the next few hours.'],
      inputs: { temperature: 31, rainProbability: 12, humidity: 58, windSpeed: 10, soilMoisture: 18, crop: 'Rice', growthStage: 'flowering' },
      weatherAvailable: false, source: 'Calculated Risk Engine (seed reference)', dataType: 'calculated',
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  console.log('Seed complete. Demo login: demo@agrishield.ai / Demo@123');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
