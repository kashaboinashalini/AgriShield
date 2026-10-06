const mongoose = require('mongoose');
module.exports = mongoose.model('MarketPrice', new mongoose.Schema({
  crop: String, market: String, state: String,
  date: { type: Date, default: Date.now },
  pricePerKg: Number, minimumPrice: Number, maximumPrice: Number,
}));
