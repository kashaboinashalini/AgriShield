const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  const data = await Notification.find({ user: req.user.id }).sort('-createdAt').limit(50);
  const unread = await Notification.countDocuments({ user: req.user.id, read: false });
  res.json({ success: true, data, unread });
};

exports.markRead = async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
  if (!n) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, data: n });
};

exports.readAll = async (req, res) => {
  await Notification.updateMany({ user: req.user.id }, { read: true });
  res.json({ success: true, data: { message: 'All notifications marked as read.' } });
};

exports.remove = async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!n) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, data: { message: 'Notification deleted.' } });
};
