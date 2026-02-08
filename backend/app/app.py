from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from admin import setup_admin
import logging
import os

from database import get_db, engine
from models import Base
from routers import (
    auth, onboarding, dashboard, learning,
    quiz, rewards, materials, help_support, notifications,
    analytics, grow_your_nest, cities, minigame
)
from analytics.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="NestNavigate Backend API",
    description="Backend API for the NestNavigate platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Proxy Headers (CRITICAL FOR ALB)
class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """Handle X-Forwarded-* headers from AWS ALB"""
    async def dispatch(self, request: Request, call_next):
        # Trust proxy headers from ALB
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto:
            request.scope["scheme"] = forwarded_proto
        
        forwarded_host = request.headers.get("x-forwarded-host")
        if forwarded_host:
            request.scope["headers"] = [
                (b"host", forwarded_host.encode()) 
                if name == b"host" else (name, value)
                for name, value in request.scope["headers"]
            ]
        
        response = await call_next(request)
        return response

# Proxy middleware FIRST (before all others)
app.add_middleware(ProxyHeadersMiddleware)

# Trusted Hosts
if ENVIRONMENT == "production":
    ALLOWED_HOSTS = os.getenv(
        "ALLOWED_HOSTS",
        "nestnavigate-backend-v1-alb-1309778730.us-east-1.elb.amazonaws.com"
    ).split(",")
    
    # This middleware handles proxy headers
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=ALLOWED_HOSTS
    )
    logger.info(f"Production mode: Allowed hosts = {ALLOWED_HOSTS}")
else:
    ALLOWED_HOSTS = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "host.docker.internal",
        "testserver",  # Starlette/httpx TestClient default host
    ]
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=ALLOWED_HOSTS
    )
    logger.info(f"Development mode: Allowed hosts = {ALLOWED_HOSTS}")

# CORS Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://main.dzynw01sy9n1b.amplifyapp.com,http://localhost:3000,http://localhost:5173,https://app.nestnavigate.com"
).split(",")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Session (with secure cookie config)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),
    session_cookie="admin_session",
    max_age=86400,  # 24 hours
    same_site="lax",
    https_only=(ENVIRONMENT == "production"),
)

# Rate Limiting Configuration
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
logger.info("Rate limiting enabled for high-volume endpoints")

# Setup admin interface
setup_admin(app)

# Startup event: Initialize scheduler
@app.on_event("startup")
async def startup_event():
    """Initialize background scheduler on application startup"""
    try:
        logger.info("Starting analytics scheduler...")
        # Use APScheduler for development, Celery for production
        use_apscheduler = os.getenv("USE_APSCHEDULER", "true").lower() == "true"
        start_scheduler(use_apscheduler=use_apscheduler)
        logger.info("Analytics scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}", exc_info=True)

# Shutdown event: Stop scheduler gracefully
@app.on_event("shutdown")
async def shutdown_event():
    """Stop scheduler on application shutdown"""
    try:
        logger.info("Stopping analytics scheduler...")
        stop_scheduler()
        logger.info("Analytics scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}", exc_info=True)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(minigame.router, prefix="/api/minigame", tags=["Mini-Game"])
app.include_router(rewards.router, prefix="/api/rewards", tags=["Rewards"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(help_support.router, prefix="/api/help", tags=["Help & Support"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(grow_your_nest.router, prefix="/api/grow-your-nest", tags=["Grow Your Nest"])
app.include_router(cities.router, prefix="/api/v1/cities", tags=["Cities"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
# Single route for Grow Your Nest
API_ROUTE_GROW_YOUR_NEST = "grow-your-nest"
ROUTE_TAG_GROW_YOUR_NEST = "Grow Your Nest"
app.include_router(
    grow_your_nest.router,
    prefix=f"/api/{API_ROUTE_GROW_YOUR_NEST}",
    tags=[ROUTE_TAG_GROW_YOUR_NEST],
)

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
        "api": "Nest Navigate API Platform",
        "version": "1.0.0",
        "status": "running",
        "environment": ENVIRONMENT,
        "features": [
            "User Authentication",
            "Onboarding Flow", 
            "Learning Modules",
            "Quiz System",
            "Reward System",
            "Badge System",
            "Materials & Resources",
            "Help & Support",
            "Notifications",
            "Grow Your Nest Minigame",
            "City Search (Google Places API)"
        ]
    }

# This is the handler function that Mangum will call
handler = Mangum(app)