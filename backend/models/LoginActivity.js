const mongoose = require('mongoose');

// Tracks sign-ins and sign-outs so you can review recent account activity
// in MongoDB (collection: loginactivities) or via GET /api/auth/activity.
const loginActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  action: { type: String, enum: ['register', 'login', 'demo-login', 'logout', 'password-change'], required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
