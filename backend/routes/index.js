const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');

const auth = require('../controllers/authController');
const farms = require('../controllers/farmController');
const scans = require('../controllers/scanController');
const soil = require('../controllers/soilController');
const crops = require('../controllers/cropController');
const irrigation = require('../controllers/irrigationController');
const weather = require('../controllers/weatherController');
const risk = require('../controllers/riskController');
const market = require('../controllers/marketController');
const profit = require('../controllers/profitController');
const calendar = require('../controllers/calendarController');
const chat = require('../controllers/chatController');
const schemes = require('../controllers/schemeController');
const satellite = require('../controllers/satelliteController');
const notifications = require('../controllers/notificationController');
const dashboard = require('../controllers/dashboardController');
const analytics = require('../controllers/analyticsController');
const search = require('../controllers/searchController');

// --- Authentication ---
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/demo', auth.demo);
router.post('/auth/logout', protect, auth.logout);
router.get('/auth/me', protect, auth.me);
router.put('/auth/profile', protect, auth.updateProfile);
router.put('/auth/password', protect, auth.changePassword);
router.get('/auth/activity', protect, auth.activity);

// --- Dashboard & Analytics ---
router.get('/dashboard', protect, dashboard.dashboard);
router.get('/analytics/dashboard/:farmId', protect, analytics.dashboard);
router.get('/analytics/:farmId', protect, analytics.farmAnalytics);
router.get('/analytics', protect, analytics.dashboard); // defaults to all farms

// --- Farms ---
router.get('/farms', protect, farms.list);
router.get('/farms/:id', protect, farms.getById);
router.post('/farms', protect, farms.create);
router.put('/farms/:id', protect, farms.update);
router.delete('/farms/:id', protect, farms.remove);
router.patch('/farms/:id/activate', protect, farms.activate);

// --- Weather (live, by farm) ---
router.get('/weather/current/:farmId', protect, weather.current);
router.get('/weather/forecast/:farmId', protect, weather.forecast);
router.get('/weather/current', protect, weather.current);   // ?farm= / ?lat= & ?lon= / ?location=
router.get('/weather/forecast', protect, weather.forecast);
router.get('/weather', protect, weather.current);

// --- Crop & pest scans ---
router.post('/scans/crop', protect, upload.single('image'), scans.cropScan);
router.get('/scans/crop', protect, scans.cropHistory);
router.get('/scans/crop/history', protect, scans.cropHistory);
router.get('/scans/crop/:id', protect, scans.cropById);
router.post('/scans/pest', protect, upload.single('image'), scans.pestScan);
router.get('/scans/pest', protect, scans.pestHistory);
router.get('/scans/pest/history', protect, scans.pestHistory);
router.get('/scans/pest/:id', protect, scans.pestById);

// --- Soil ---
router.post('/soil/analyze', protect, soil.analyze);
router.get('/soil', protect, soil.history);
router.get('/soil/history', protect, soil.history);
router.get('/soil/:id', protect, soil.getById);

// --- Recommendations & irrigation ---
router.post('/crops/recommend', protect, crops.recommend);
router.post('/irrigation/analyze', protect, irrigation.analyze);
router.get('/irrigation', protect, irrigation.history);
router.get('/irrigation/history', protect, irrigation.history);

// --- Risk & disasters ---
router.post('/risk/analyze', protect, risk.analyze);
router.get('/risk/history', protect, risk.history);
router.get('/risk/:farmId', protect, risk.farmRisks);
router.get('/risks', protect, risk.risks);
router.get('/disasters', protect, risk.disasters);

// --- Markets ---
router.get('/markets/prices', protect, market.markets);
router.get('/markets', protect, market.markets);
router.get('/markets/trends', protect, market.trends);

// --- Profit ---
router.post('/profit/calculate', protect, profit.calculate);
router.get('/profit', protect, profit.history);
router.get('/profit/history', protect, profit.history);

// --- Tasks / calendar ---
router.get('/tasks', protect, calendar.list);
router.post('/tasks', protect, calendar.create);
router.put('/tasks/:id', protect, calendar.update);
router.patch('/tasks/:id/complete', protect, calendar.complete);
router.delete('/tasks/:id', protect, calendar.remove);
router.post('/calendar/generate', protect, calendar.generate);
router.get('/calendar', protect, calendar.list);
router.put('/calendar/tasks/:id', protect, calendar.update);

// --- Assistant & schemes ---
router.post('/chat', protect, chat.chat);
router.get('/chat/history', protect, chat.history);
router.get('/schemes', protect, schemes.list);
router.get('/schemes/:id', protect, schemes.getById);

// --- Satellite ---
router.get('/satellite/:farmId', protect, satellite.satellite);

// --- Notifications ---
router.get('/notifications', protect, notifications.list);
router.put('/notifications/:id/read', protect, notifications.markRead);
router.put('/notifications/read-all', protect, notifications.readAll);
router.delete('/notifications/:id', protect, notifications.remove);

// --- Global search ---
router.get('/search', protect, search.search);

module.exports = router;
