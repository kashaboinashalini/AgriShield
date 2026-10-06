const mongoose = require('mongoose');
module.exports = mongoose.model('WeatherRecord', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: String, temperature: Number, humidity: Number,
  rainProbability: Number, windSpeed: Number, condition: String,
  demo: Boolean, forecast: Array, recommendations: [String],
}, { timestamps: true }));
