# Deploying AgriShield AI on Railway

The app has 3 pieces. On Railway you create a project with **three services** plus **MongoDB**:

| Service | Type | What it runs |
|---|---|---|
| `web` | Node + static React | Express API on :5000 + built Vite frontend (served by the backend) |
| `ai-service` | Python | FastAPI image analysis on :8000 |
| `mongodb` | MongoDB | Railway MongoDB plugin (or external MongoDB Atlas) |

## Option A — Deploy with Dockerfiles (recommended, predictable)

1. Push this `agriShield/` folder (or repo root containing it) to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo**.
3. First service (the whole app):
   - Settings → **Dockerfile Path**: `agriShield/Dockerfile.web` (if the folder `agriShield/` is the repo root, use `Dockerfile.web`).
   - Set variables (below). Deploy. Note its public URL, e.g. `https://agrishield-web.up.railway.app`.
4. Add second service (New → GitHub Repo → same repo):
   - **Root Directory**: `agriShield/ai-service`
   - Railway auto-detects `ai-service/Dockerfile`. Deploy. Note its URL, e.g. `https://ai-service-production.up.railway.app`.
5. Add a **MongoDB** database (New → Database → MongoDB), open it, and copy the connection string
   (`mongodb://...` or `MONGO_URL`).

### Environment variables

**`web` service**

```
MONGODB_URI=${{MongoDB.MONGO_URL}}        # from the MongoDB service in the same project
JWT_SECRET=<long random string>
# PORT: Railway injects this automatically; omit it
CLIENT_URL=https://<your-web-service>.up.railway.app
AI_SERVICE_URL=https://<your-ai-service>.up.railway.app
WEATHER_API_KEY=<your openweathermap key>   # optional; app shows honest "unavailable" without it
MARKET_API_KEY=<your data.gov.in key>       # optional; labelled reference dataset without it
```

**`ai-service` service**: no variables needed. Railway injects `PORT`; the Dockerfile maps it.

Then open the web service's URL — login with the demo credentials:
`demo@agrishield.ai` / `Demo@123` (seed once: see below).

### Seed the production database (once)

```bash
cd backend
MONGODB_URI="<railway/atlas connection string>" npm run seed
```

## Option B — No Dockerfiles (Nixpacks auto-detect)

**Service "web":**
- Build command: `cd frontend && npm install && npm run build && cd ../backend && npm ci --omit=dev`
- Start command: `node backend/server.js`

**Service "ai-service"** (set *Root Directory* to `ai-service`):
- Build command: `pip install -r requirements.txt`
- Start command: `python main.py`
  (`main.py` reads the `PORT` env var Railway injects, defaulting to 8000 locally — safe for Railway which parses plain integers, not shell `${}` syntax)

> Railway injects `PORT` — both start commands above honor it (`backend/server.js` reads `process.env.PORT`).

## Notes / gotchas

- **Uploaded scan images are ephemeral** on Railway's filesystem. Attach a Volume to the web service
  mounted at `backend/uploads` if you want to keep them, or extend `scanController` to upload to S3.
- Never commit `.env`. All secrets live in Railway's Variables tab.
- After deploying, run the seed once against the production DB:
  `MONGODB_URI="<prod connection string>" npm --prefix backend run seed` (or `node backend/seed/seed.js` with env set).
- Login demo account after seeding: `demo@agrishield.ai` / `Demo@123`.
