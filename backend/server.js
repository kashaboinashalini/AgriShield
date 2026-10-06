const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
dotenv.config();

const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

// --- Security ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in a few minutes.' },
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'agrishield-backend' }));

// Centralized error handler — consistent response shape
app.use((err, req, res, next) => {
  console.error('[API Error]', err.message);
  const status = err.type === 'entity.parse.failed' ? 400 : err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Something went wrong' });
});
// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));

// Serve built frontend in production
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (require('fs').existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`AgriShield backend listening on :${PORT}`)));
