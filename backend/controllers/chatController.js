const ChatMessage = require('../models/ChatMessage');
const Farm = require('../models/Farm');
const SoilAnalysis = require('../models/SoilAnalysis');
const IrrigationRecord = require('../models/IrrigationRecord');
const CropScan = require('../models/CropScan');
const { chatRespond } = require('../services/chatEngine');
const { getWeather } = require('../services/weatherService');

exports.chat = async (req, res) => {
  const { message, language, farmId } = req.body;
  if (!message || !String(message).trim()) return res.status(400).json({ message: 'Please type a message.' });

  await ChatMessage.create({ user: req.user?.id, role: 'user', message, language: language || 'English' });

  // Gather real context: farm, soil, irrigation, latest scan, live weather
  let context = {};
  try {
    const farm = farmId ? await Farm.findOne({ _id: farmId, user: req.user?.id }) : await Farm.findOne({ user: req.user?.id }).sort('createdAt');
    context.farm = farm || undefined;
    context.soil = await SoilAnalysis.findOne({ user: req.user?.id }).sort('-createdAt');
    context.irrigation = await IrrigationRecord.findOne({ user: req.user?.id }).sort('-createdAt');
    context.latestScan = await CropScan.findOne({ user: req.user?.id }).sort('-createdAt');
    const w = await getWeather({
      lat: farm?.latitude ?? undefined,
      lon: farm?.longitude ?? undefined,
      location: farm ? `${farm.district || ''}, ${farm.state || ''}`.replace(/^,\s*|,\s*$/g, '') : undefined,
    });
    context.weather = w && !w.unavailable ? w : null;
  } catch {}

  const reply = chatRespond(message, language || 'English', context);
  await ChatMessage.create({ user: req.user?.id, role: 'assistant', message: reply, language: language || 'English' });
  res.json({ success: true, data: { reply, language: language || 'English' } });
};
exports.history = async (req, res) => {
  const data = await ChatMessage.find({ user: req.user.id }).sort('createdAt').limit(100);
  res.json({ success: true, data });
};
