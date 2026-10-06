const mongoose = require('mongoose');
module.exports = mongoose.model('ChatMessage', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: String, message: String, language: { type: String, default: 'English' },
}, { timestamps: true }));
