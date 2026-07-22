import logging
import os
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.routers.news import router as news_router


APP_NAME = "TrueFact News API"
APP_VERSION = "0.2.0"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Run startup and shutdown tasks."""
    app.state.started_at = datetime.now(timezone.utc)
    logger.info("%s started", APP_NAME)

    yield

    logger.info("%s stopped", APP_NAME)


tags_metadata = [
    {
        "name": "System",
        "description": "API status and service information.",
    },
    {
        "name": "News",
        "description": "Global news articles and evidence information.",
    },
]


app = FastAPI(
    title=APP_NAME,
    summary="Backend service for the TrueFact News platform",
    description=(
        "TrueFact News collects global news, compares sources, "
        "tracks engagement, and provides transparent evidence scores."
    ),
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
)


default_origins = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8081",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        ",".join(default_origins),
    ).split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)


app.include_router(news_router)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add API processing time to every response."""
    started = time.perf_counter()
    response = await call_next(request)

    process_time = time.perf_counter() - started
    response.headers["X-Process-Time"] = f"{process_time:.4f}"

    return response


@app.get(
    "/",
    tags=["System"],
    summary="API homepage",
)
async def home():
    return {
        "message": "Welcome to TrueFact News API",
        "status": "running",
        "version": APP_VERSION,
        "documentation": "/docs",
        "alternative_documentation": "/redoc",
        "news_endpoint": "/api/v1/news/",
    }


@app.get(
    "/health",
    tags=["System"],
    summary="Check API health",
)
async def health_check(request: Request):
    now = datetime.now(timezone.utc)
    started_at = getattr(request.app.state, "started_at", now)
    uptime = (now - started_at).total_seconds()

    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": APP_VERSION,
        "environment": os.getenv("APP_ENV", "development"),
        "timestamp": now.isoformat(),
        "uptime_seconds": round(uptime, 2),
    }
    