const jwt = require('jsonwebtoken');
module.exports = function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authorized. Please log in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'agrishield_demo_secret_change_me');
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};
