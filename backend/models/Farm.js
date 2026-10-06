const mongoose = require('mongoose');
const farmSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmName: { type: String, required: true },
  village: String, district: String, state: String,
  area: { type: Number, required: true },
  unit: { type: String, default: 'acres' },
  soilType: String, irrigationType: String,
  currentCrop: String, sowingDate: Date,
  latitude: Number, longitude: Number,
}, { timestamps: true });
module.exports = mongoose.model('Farm', farmSchema);
