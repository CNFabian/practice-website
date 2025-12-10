from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from mangum import Mangum
import logging
import os

from database import get_db, engine
from models import Base
from routers import (
    auth, onboarding, dashboard, learning, 
    quiz, rewards, materials, help_support, notifications
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Gamified Learning Platform API",
    description="A comprehensive backend for a gamified homebuying education platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# When allow_credentials=True, you CANNOT use allow_origins=["*"]
# You must specify exact origins
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://main.dzynw01sy9n1b.amplifyapp.com,http://localhost:3000,http://localhost:5173,https://app.nestnavigate.com"
).split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Configure this for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicit methods
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(rewards.router, prefix="/api/rewards", tags=["Rewards"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(help_support.router, prefix="/api/help", tags=["Help & Support"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Gamified Learning Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Simple database connectivity check
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )

@app.get("/api/status")
def api_status():
    """API status endpoint"""
    return {
        "api": "Gamified Learning Platform",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "User Authentication",
            "Onboarding Flow", 
            "Learning Modules",
            "Quiz System",
            "Reward System",
            "Badge System",
            "Materials & Resources",
            "Help & Support",
            "Notifications"
        ]
    }

# This is the handler function that Mangum will call
handler = Mangum(app)