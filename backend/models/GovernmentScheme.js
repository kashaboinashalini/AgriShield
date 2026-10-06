const mongoose = require('mongoose');
module.exports = mongoose.model('GovernmentScheme', new mongoose.Schema({
  name: String, description: String, eligibility: String, benefits: String,
  state: String, applicationInfo: String, farmerType: String, crop: String,
  landSizeCriteria: String, url: String, lastVerified: { type: Date, default: Date.now },
}));
