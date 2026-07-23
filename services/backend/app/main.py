import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.routers.credibility import router as credibility_router
from app.routers.fact_checks import router as fact_checks_router
from app.routers.news import router as news_router
from app.routers.social_posts import router as social_posts_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("%s started", settings.app_name)
    yield
    logger.info("%s stopped", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Backend API for news aggregation, social engagement, "
        "and transparent credibility assessments."
    ),
    lifespan=lifespan,
)

app.include_router(news_router)
app.include_router(social_posts_router)
app.include_router(credibility_router)
app.include_router(fact_checks_router)


@app.get(
    "/",
    tags=["System"],
    summary="Get API information",
)
def read_root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
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
