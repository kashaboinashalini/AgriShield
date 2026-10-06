const Farm = require('../models/Farm');

exports.list = async (req, res) => {
  const [farms, user] = await Promise.all([
    Farm.find({ user: req.user.id }).sort('-createdAt'),
    require('../models/User').findById(req.user.id),
  ]);
  const activeId = user?.activeFarm ? String(user.activeFarm) : null;
  res.json({
    success: true,
    data: farms.map(f => ({ ...f.toObject(), active: activeId === String(f._id) })),
    activeFarmId: activeId,
  });
};

exports.getById = async (req, res) => {
  const farm = await Farm.findOne({ _id: req.params.id, user: req.user.id });
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
  res.json({ success: true, data: farm });
};

exports.create = async (req, res) => {
  try {
    const { farmName, area } = req.body;
    if (!farmName || !area) return res.status(400).json({ success: false, message: 'Farm name and area are required.' });
    if (isNaN(Number(req.body.area)) || Number(req.body.area) <= 0) return res.status(400).json({ success: false, message: 'Area must be a positive number.' });
    const farm = await Farm.create({ ...req.body, user: req.user.id });
    // first farm becomes the active farm
    const user = await require('../models/User').findById(req.user.id);
    if (!user.activeFarm) { user.activeFarm = farm._id; await user.save(); }
    res.status(201).json({ success: true, data: farm });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Could not create farm.', error: e.message });
  }
};

exports.update = async (req, res) => {
  const farm = await Farm.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
  res.json({ success: true, data: farm });
};

exports.remove = async (req, res) => {
  const farm = await Farm.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
  const user = await require('../models/User').findById(req.user.id);
  if (String(user.activeFarm) === String(farm._id)) {
    const next = await Farm.findOne({ user: req.user.id }).sort('-createdAt');
    user.activeFarm = next ? next._id : null;
    await user.save();
  }
  res.json({ success: true, data: { message: 'Farm deleted.' } });
};

// PATCH /api/farms/:id/activate — set active farm
exports.activate = async (req, res) => {
  const farm = await Farm.findOne({ _id: req.params.id, user: req.user.id });
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });
  await require('../models/User').findByIdAndUpdate(req.user.id, { activeFarm: farm._id });
  res.json({ success: true, data: { message: `${farm.farmName} is now your active farm.`, farm } });
};
