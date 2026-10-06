const mongoose = require('mongoose');
module.exports = mongoose.model('FarmTask', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  crop: String, title: String, type: String,
  dueDate: Date, status: { type: String, default: 'pending' },
}, { timestamps: true }));
