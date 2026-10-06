const path = require('path');
const CropScan = require('../models/CropScan');
const PestScan = require('../models/PestScan');
const { analyzeImage } = require('../services/aiClient');

exports.cropScan = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a valid JPG or PNG image.' });
    const abs = path.join(__dirname, '..', 'uploads', path.basename(req.file.path));
    const result = await analyzeImage(abs, 'crop');
    if (result && result.valid === false) {
      try { require('fs').unlinkSync(abs); } catch {}
      return res.status(422).json({ success: false, message: result.reason || 'The uploaded image does not appear to be an agricultural crop image.', category: result.category, dataType: 'validation' });
    }
    const scan = await CropScan.create({ user: req.user.id, farm: req.body.farm || undefined, imagePath: '/uploads/' + path.basename(req.file.path), crop: result.crop, disease: result.disease, confidence: result.confidence, severity: result.severity, risk: result.risk, symptoms: result.symptoms || [], recommendations: result.recommendations || [], prevention: result.prevention || [], demo: !!result.demo });
    if (result.risk === 'HIGH' && req.user) {
      const recent = await require('../models/Notification').findOne({ user: req.user.id, type: 'disease', createdAt: { $gte: new Date(Date.now() - 6 * 3600000) } });
      if (!recent) await require('../models/Notification').create({ user: req.user.id, title: 'Disease Risk', message: `${result.disease} detected on ${result.crop} with ${result.confidence}% confidence (HIGH risk).`, type: 'disease', read: false });
    }
    res.json({ success: true, data: scan });
  } catch (e) { res.status(500).json({ success: false, message: 'Unable to process this image.', error: e.message }); }
};
exports.cropHistory = async (req, res) => res.json({ success: true, data: await CropScan.find({ user: req.user.id }).sort('-createdAt') });

exports.cropById = async (req, res) => {
  const scan = await CropScan.findOne({ _id: req.params.id, user: req.user.id });
  if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
  res.json({ success: true, data: scan });
};

exports.pestScan = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a valid JPG or PNG image.' });
    const abs = path.join(__dirname, '..', 'uploads', path.basename(req.file.path));
    const result = await analyzeImage(abs, 'pest');
    if (result && result.valid === false) {
      try { require('fs').unlinkSync(abs); } catch {}
      return res.status(422).json({ success: false, message: result.reason || 'The uploaded image does not appear to be a valid crop/pest image.', category: result.category, dataType: 'validation' });
    }
    const scan = await PestScan.create({ user: req.user.id, farm: req.body.farm || undefined, imagePath: '/uploads/' + path.basename(req.file.path), crop: result.crop, pest: result.pest || result.disease, confidence: result.confidence, damageLevel: result.damageLevel || result.severity, prevention: result.prevention || [], action: (result.recommendations || ['Consult an expert'])[0], demo: !!result.demo });
    res.json({ success: true, data: scan });
  } catch (e) { res.status(500).json({ success: false, message: 'Unable to process this image.', error: e.message }); }
};
exports.pestHistory = async (req, res) => res.json({ success: true, data: await PestScan.find({ user: req.user.id }).sort('-createdAt') });

exports.pestById = async (req, res) => {
  const scan = await PestScan.findOne({ _id: req.params.id, user: req.user.id });
  if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
  res.json({ success: true, data: scan });
};
