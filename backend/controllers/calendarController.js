const FarmTask = require('../models/FarmTask');
const { CROPS } = require('../services/cropService');

// POST /api/tasks — create a single task (also POST /api/calendar/generate for auto-generation)
exports.create = async (req, res) => {
  try {
    const { title, farm, crop, dueDate, priority, description, type, time } = req.body;
    if (!title || !dueDate) return res.status(400).json({ success: false, message: 'Task title and date are required.' });
    const task = await FarmTask.create({
      user: req.user.id, farm: farm || undefined, crop: crop || '', title,
      type: type || 'custom', dueDate: new Date(dueDate), time,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      description: description || '', status: 'pending',
    });
    res.status(201).json({ success: true, data: task });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Could not create task.', error: e.message });
  }
};

// POST /api/calendar/generate — auto-generate crop calendar
exports.generate = async (req, res) => {
  try {
    const { farm, crop, sowingDate } = req.body;
    if (!crop || !sowingDate) return res.status(400).json({ success: false, message: 'Crop and sowing date are required.' });
    const start = new Date(sowingDate);
    const duration = (CROPS.find(c => c.name.toLowerCase() === String(crop).toLowerCase()) || { duration: 120 }).duration;
    const tasks = [
      { title: 'Seed selection & treatment', type: 'seed', offset: -7, priority: 'high' },
      { title: 'Land preparation', type: 'sowing', offset: -3, priority: 'high' },
      { title: 'Sowing', type: 'sowing', offset: 0, priority: 'high' },
      { title: 'First irrigation', type: 'irrigation', offset: 2, priority: 'medium' },
      { title: 'Basal fertilizer application', type: 'fertilizer', offset: 3, priority: 'medium' },
      { title: 'Pest monitoring', type: 'pest', offset: Math.round(duration * 0.25), priority: 'medium' },
      { title: 'Second fertilizer dose', type: 'fertilizer', offset: Math.round(duration * 0.35), priority: 'medium' },
      { title: 'Disease scouting', type: 'disease', offset: Math.round(duration * 0.45), priority: 'medium' },
      { title: 'Pest monitoring (flowering stage)', type: 'pest', offset: Math.round(duration * 0.6), priority: 'medium' },
      { title: 'Pre-harvest irrigation', type: 'irrigation', offset: Math.round(duration * 0.8), priority: 'medium' },
      { title: 'Harvesting', type: 'harvest', offset: duration, priority: 'high' },
    ];
    await FarmTask.deleteMany({ user: req.user.id, crop });
    const docs = await FarmTask.insertMany(tasks.map(t => ({
      user: req.user.id, farm: farm || undefined, crop, title: t.title, type: t.type,
      priority: t.priority, dueDate: new Date(start.getTime() + t.offset * 86400000), status: 'pending',
    })));
    res.json({ success: true, data: docs });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Could not generate calendar.', error: e.message });
  }
};

exports.list = async (req, res) => {
  const tasks = await FarmTask.find({ user: req.user.id }).sort('dueDate');
  const now = new Date();
  res.json({
    success: true,
    data: tasks,
    summary: {
      total: tasks.length,
      pending: tasks.filter(t => t.status !== 'completed').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < now).length,
      upcoming: tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) >= now).length,
    },
  });
};

// PUT /api/tasks/:id — edit any field or set status
exports.update = async (req, res) => {
  const allowed = ['title', 'farm', 'crop', 'dueDate', 'time', 'priority', 'description', 'status', 'type'];
  const update = {};
  Object.keys(req.body || {}).forEach((k) => { if (allowed.includes(k)) update[k] = k === 'dueDate' ? new Date(req.body.dueDate) : req.body[k]; });
  const t = await FarmTask.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, { new: true });
  if (!t) return res.status(404).json({ success: false, message: 'Task not found.' });
  res.json({ success: true, data: t });
};

// PATCH /api/tasks/:id/complete
exports.complete = async (req, res) => {
  const t = await FarmTask.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { status: 'completed' }, { new: true });
  if (!t) return res.status(404).json({ success: false, message: 'Task not found.' });
  res.json({ success: true, data: t });
};

exports.remove = async (req, res) => {
  const t = await FarmTask.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!t) return res.status(404).json({ success: false, message: 'Task not found.' });
  res.json({ success: true, data: { message: 'Task deleted.' } });
};
