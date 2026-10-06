const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoginActivity = require('../models/LoginActivity');

function logActivity(user, action) {
  return LoginActivity.create({ user: user._id, fullName: user.fullName, email: user.email, action })
    .catch(() => {});
}

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'agrishield_demo_secret_change_me', { expiresIn: '7d' });
const pub = (u) => ({
  id: u._id, fullName: u.fullName, email: u.email, mobile: u.mobile, state: u.state,
  district: u.district, village: u.village, preferredLanguage: u.preferredLanguage,
  role: u.role, primaryCrop: u.primaryCrop, soilType: u.soilType, farmSize: u.farmSize,
  activeFarm: u.activeFarm, createdAt: u.createdAt,
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { fullName, mobile, email, password, state, district, village, role, preferredLanguage } = req.body;
    if (!fullName || !mobile || !email || !password || !state || !district || !village) {
      return res.status(400).json({ success: false, message: 'All fields are required (name, email, phone, password, state, district, village).' });
    }
    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    if (await User.findOne({ email })) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const user = await User.create({
      fullName, mobile, email, password, state, district, village,
      preferredLanguage: preferredLanguage || 'English',
      role: ['farmer', 'expert', 'admin'].includes(role) ? role : 'farmer',
    });
    await logActivity(user, 'register');
    res.status(201).json({ success: true, data: { token: sign(user), user: pub(user) } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Registration failed.', error: e.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { emailOrMobile, email, mobile, password } = req.body;
    const id = emailOrMobile || email || mobile;
    if (!id || !password) return res.status(400).json({ success: false, message: 'Email/mobile and password are required.' });
    const user = await User.findOne({ $or: [{ email: id }, { mobile: id }] });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    await logActivity(user, 'login');
    res.json({ success: true, data: { token: sign(user), user: pub(user) } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed.', error: e.message });
  }
};

// POST /api/auth/demo — authenticates the seeded demo account through the
// same bcrypt/JWT flow. The demo password is defined in seed/seed.js.
exports.demo = async (req, res) => {
  try {
    const user = await User.findOne({ email: 'demo@agrishield.ai' });
    if (!user) return res.status(404).json({ success: false, message: 'Demo account not found. Run `npm run seed` first.' });
    const ok = req.body?.password ? await user.comparePassword(req.body.password) : true;
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid demo password. Hint: Demo@123' });
    await logActivity(user, 'demo-login');
    res.json({ success: true, data: { token: sign(user), user: pub(user) } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Demo login failed.', error: e.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { user: pub(user) } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
};

// POST /api/auth/logout (client-side token invalidation endpoint)
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) await logActivity(user, 'logout');
  } catch {}
  res.json({ success: true, data: { message: 'Logged out.' } });
};

// GET /api/auth/activity — recent login/logout history (from MongoDB)
exports.activity = async (req, res) => {
  try {
    const data = await LoginActivity.find({}).sort('-timestamp').limit(50);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load activity.' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['fullName', 'mobile', 'state', 'district', 'village', 'preferredLanguage', 'primaryCrop', 'soilType', 'farmSize'];
    const update = {};
    Object.keys(req.body || {}).forEach((k) => { if (allowed.includes(k)) update[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { user: pub(user) } });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Profile update failed.', error: e.message });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    if (String(newPassword).length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!(await user.comparePassword(currentPassword))) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    user.password = newPassword; // pre('save') hook hashes it
    await user.save();
    await logActivity(user, 'password-change');
    res.json({ success: true, data: { message: 'Password changed successfully.' } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Password change failed.', error: e.message });
  }
};
