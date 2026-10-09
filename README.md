# 🌾 AgriShield AI — AI-Powered Smart Farming & Rural Development Platform

**Analyze → Predict → Recommend → Protect → Improve**

A complete, production-style MERN + Python AI application for agriculture and rural development. Real frontend, real backend, real MongoDB database, real authentication, real API communication, real image analysis, real calculations, real dashboards, real notifications and real map/location functionality.

## Architecture

```text
React 18 + TypeScript + Vite + Tailwind + React Router + Axios + Recharts + Leaflet
        │  REST API (/api, JWT)
        ↓
Node.js + Express + MongoDB (Mongoose)
        │
        ├── OpenWeather API (live weather — fails honestly, never fakes data)
        ├── data.gov.in / AGMARKNET (government market prices)
        └── Python FastAPI AI Service (crop disease + pest image analysis)
```

## Project Structure

```text
agriShield/
├── frontend/        React, TypeScript, Vite, Tailwind, React Router, Recharts, Leaflet
├── backend/         Express, Mongoose, JWT, bcrypt, multer, helmet, rate limiting
├── ai-service/      FastAPI + Pillow + OpenCV deterministic local image analysis
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally (default: `mongodb://127.0.0.1:27017`)

## Setup

```bash
# 1. Backend
cd agriShield/backend
npm install
npm run seed          # seeds demo farmer + realistic data into MongoDB
npm start             # http://localhost:5000

# 2. AI Service (crop/pest image analysis)
cd agriShield/ai-service
pip install -r requirements.txt
python main.py        # http://localhost:8000

# 3. Frontend
cd agriShield/frontend
npm install
npm run dev           # http://localhost:5173
```

**Demo login:** `demo@agrishield.ai` / `Demo@123` — a real MongoDB account that authenticates through the normal JWT login flow. Click "Continue as Demo Farmer" on the login page.

## Features

- **Authentication** — register / login / logout / JWT / bcrypt hashing / protected routes / profile update / change password. Roles: Farmer (default), Agriculture Expert, Admin.
- **Real-time Dashboard** — farm area, crop health, disease risk, soil health, water status, weather risk, estimated profit. Every card shows value, status, source and last-updated. Recent activities, notifications and upcoming tasks from MongoDB.
- **Farm Management** — multi-farm CRUD, acres/hectares, owner/village/district/state, coordinates, soil & irrigation type, active farm selection.
- **Location** — browser geolocation, manual entry, or click-to-pick on the map. Coordinates drive weather, risk and maps.
- **Live Weather** — OpenWeatherMap when `WEATHER_API_KEY` is set, otherwise **Open-Meteo** (free, keyless). Temperature, humidity, rain, wind, pressure, clouds, sunrise/sunset, 5–7 day forecast, and weather-based farm recommendations from real conditions. If both providers fail the app says "Live weather data is temporarily unavailable" — it never shows fake weather.
- **Disease Detection** — upload/capture leaf image → Express + Multer → Python FastAPI (Pillow + OpenCV pixel statistics) → prediction → MongoDB. Transparent local pipeline, labelled "AI Demo Analysis" (not a medical-grade diagnosis).
- **Pest Detection** — separate module with confidence, damage level, action and prevention; full scan history.
- **Soil Health Analyzer** — pH, N, P, K, moisture, temperature → dynamically calculated score, statuses and recommendations.
- **Crop Recommendation Engine** — transparent rule-based scoring; recommendations change with inputs.
- **Irrigation Advisor** — combines user inputs with live weather (when available); water requirement in litres, next check, factor breakdown.
- **Risk Assessment** — weather, disease, pest, water and soil risk (Low/Moderate/High/Critical) with recommended actions; persisted per farm.
- **Disaster Alerts** — heavy rainfall, flood risk, extreme heat, strong wind, drought — from live weather only, clearly source-labelled.
- **Market Prices** — AGMARKNET / data.gov.in government data when a key is configured; otherwise a clearly-labelled reference dataset. Filters: crop, state, district, market.
- **Profit Calculator** — full cost breakdown (seed, fertilizer, pesticide, labor, irrigation, machinery, transportation, other), revenue, profit, profit/acre, ROI, break-even price, charts, saved history.
- **Farm Calendar** — task CRUD, priorities, overdue/upcoming/completed, auto-generated crop calendar, notifications.
- **AI Assistant** — local agricultural knowledge engine with real farm context (soil, irrigation, weather, scans). English + తెలుగు.
- **Government Schemes** — PM-KISAN, PMFBY, Rythu Bandhu, Soil Health Card, PKSY with eligibility, benefits, official links. Never claims a farmer is eligible — "verify on the official portal".
- **Satellite Analysis** — clearly labelled **Demo Mode** simulated vegetation index (structured for Sentinel/Landsat integration).
- **Farm Map** — real Leaflet + OpenStreetMap with farm markers, click-to-pick coordinates, browser geolocation.
- **Analytics** — charts computed from actual MongoDB history (crop health trend, soil health, irrigation, profit, risk, weather, disease/pest detections) plus a computed Farm Health Score.
- **Notifications** — generated from real application events; mark read / mark all read / delete; unread badge in header.
- **Global Search** — farms, crops, tasks, schemes, scans and market data from the header search box.
- **Bilingual UI** — English | తెలుగు toggle in the header and settings.
- **Data Source Labelling** — every module is labelled: LIVE DATA, LATEST AVAILABLE DATA, DATABASE DATA, CALCULATED DATA, AI ANALYSIS, or DEMO/SIMULATED DATA.

## API Overview

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register` `login` `demo` `logout` · `GET /auth/me` · `PUT /auth/profile` `PUT /auth/password` |
| Farms | `GET/POST /api/farms` · `GET/PUT/DELETE /api/farms/:id` · `PATCH /api/farms/:id/activate` |
| Weather | `GET /api/weather/current/:farmId` · `GET /api/weather/forecast/:farmId` |
| Scans | `POST /api/scans/crop` `POST /api/scans/pest` · `GET /api/scans/crop` `GET /api/scans/crop/:id` (same for pest) |
| Soil | `POST /api/soil/analyze` · `GET /api/soil` `GET /api/soil/:id` |
| Crops | `POST /api/crops/recommend` |
| Irrigation | `POST /api/irrigation/analyze` · `GET /api/irrigation` |
| Risk | `POST /api/risk/analyze` · `GET /api/risk/:farmId` · `GET /api/risks` `GET /api/risk/history` |
| Disasters | `GET /api/disasters` |
| Markets | `GET /api/markets/prices` · `GET /api/markets/trends` |
| Profit | `POST /api/profit/calculate` · `GET /api/profit` |
| Tasks | `GET/POST /api/tasks` · `PUT/DELETE /api/tasks/:id` · `PATCH /api/tasks/:id/complete` |
| Assistant | `POST /api/chat` · `GET /api/chat/history` |
| Schemes | `GET /api/schemes` · `GET /api/schemes/:id` |
| Notifications | `GET /api/notifications` · `PUT /api/notifications/:id/read` `PUT /api/notifications/read-all` `DELETE /api/notifications/:id` |
| Analytics | `GET /api/analytics/dashboard/:farmId` (or `all`) |
| Search | `GET /api/search?q=…` |

All responses use `{ "success": true, "data": … }` / `{ "success": false, "message": "…" }`.

## Environment Variables (`.env.example` → `backend/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (change in production) |
| `PORT` | Backend port (default 5000) |
| `CLIENT_URL` | CORS origin |
| `AI_SERVICE_URL` | Python AI service URL |
| `WEATHER_API_KEY` | OpenWeatherMap key (blank → weather endpoints report unavailable) |
| `MARKET_API_KEY` / `MARKET_RESOURCE_ID` | data.gov.in key + resource id (blank → labelled reference dataset) |

## Security

bcrypt password hashing, JWT authentication, protected routes, role fields, input validation, file type/size limits (multer), CORS, Helmet, rate limiting, secure `.env` handling. Secrets never reach the frontend.

## Notes

- Demo/simulated data exists **only** in the seed script and clearly-labelled demo modules (satellite grid, reference market dataset, local image classifier). It is never presented as live data.
- External API failures degrade gracefully: weather/disaster modules show an explicit unavailable message while farms, soil, scans, calculator, calendar and MongoDB data keep working.
