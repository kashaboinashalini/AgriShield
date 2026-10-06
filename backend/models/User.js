const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  state: String, district: String, village: String,
  preferredLanguage: { type: String, default: 'English' },
  role: { type: String, default: 'farmer' },
  farmSize: Number, primaryCrop: String, soilType: String,
  activeFarm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function (p) { return bcrypt.compare(p, this.password); };

module.exports = mongoose.model('User', userSchema);
