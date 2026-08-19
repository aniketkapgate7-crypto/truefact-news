import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.routers.ai import router as ai_router
from app.routers.credibility import router as credibility_router
from app.routers.fact_checks import router as fact_checks_router
from app.routers.news import router as news_router
from app.routers.social_posts import router as social_posts_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    # Create a shared HTTP client for connection pooling (used by fact-check provider)
    http_client = httpx.AsyncClient(
        timeout=settings.google_fact_check_timeout_seconds,
        follow_redirects=False,
    )
    application.state.http_client = http_client

    logger.info("%s started", settings.app_name)
    try:
        yield
    finally:
        await http_client.aclose()
        logger.info("%s stopped", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version="1.1.0",
    description=(
        "Backend API for news aggregation, social engagement, "
        "and transparent credibility assessments."
    ),
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
    lifespan=lifespan,
)

if settings.app_env == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_host_list,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=[
        "DELETE",
        "GET",
        "HEAD",
        "OPTIONS",
        "PATCH",
        "POST",
        "PUT",
    ],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(news_router)
app.include_router(social_posts_router)
app.include_router(credibility_router)
app.include_router(fact_checks_router)
app.include_router(ai_router)


@app.get(
    "/",
    tags=["System"],
    summary="Get API information",
)
def read_root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs" if settings.docs_enabled else "disabled",
    }


@app.get(
    "/health",
    tags=["System"],
    summary="Check API health",
)
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": settings.app_name,
    }
