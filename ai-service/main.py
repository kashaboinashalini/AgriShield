import os
import uvicorn
from fastapi import FastAPI
from routes.analyze import router as analyze_router

app = FastAPI(title="AgriShield AI Service", version="1.0.0")
app.include_router(analyze_router, prefix="/analyze")

@app.get("/health")
def health():
    return {"status": "ok", "service": "agrishield-ai"}

if __name__ == "__main__":
    # Honor Railway's injected PORT env var; fall back to 8000 locally
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
