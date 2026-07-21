"""
DermaScreen Backend — Main Application
FastAPI entry point with CORS, lifespan, and router registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services import firebase_service, ml_service, quality_service
from app.routers import auth, scans, quality, predict, chat, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown lifecycle handler.
    Loads ML model and initializes Firebase on startup.
    """
    print("[STARTUP] DermaScreen Backend starting up...")
    print("=" * 50)

    # Initialize Firebase Admin SDK
    firebase_service.initialize_firebase()

    # Load image quality config
    quality_service.load_quality_config()

    # Load ML model lazily (on first prediction request) to save memory on startup
    # ml_service.load_model()  — now loaded on-demand in ml_service.predict()
    print("  ML model will load on first prediction request (lazy loading)")

    print("=" * 50)
    print(f"CORS allowed origin: {settings.FRONTEND_URL}")
    print(f"API docs: http://localhost:{settings.BACKEND_PORT}/docs")
    print("=" * 50)

    yield  # App is running

    print("[SHUTDOWN] DermaScreen Backend shutting down...")


# ─────────────────── Create App ───────────────────

app = FastAPI(
    title="DermaScreen API",
    description="AI-Powered Clinical Dermatology Screening Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ─────────────────── CORS Middleware ───────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────── Register Routers ───────────────────

app.include_router(auth.router, prefix="/api/v1")
app.include_router(scans.router, prefix="/api/v1")
app.include_router(quality.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


# ─────────────────── Health Check ───────────────────

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {
        "status": "healthy",
        "service": "DermaScreen API",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "message": "DermaScreen API is running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
