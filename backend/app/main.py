"""Main FastAPI application entry point for WindScope."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.clients.elexon import elexon_client
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and graceful shutdown."""
    yield
    # Close HTTPX async client session gracefully
    await elexon_client.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="UK Wind Generation Forecast Intelligence & Accuracy Analytics for Wholesale Power Purchasing.",
    lifespan=lifespan,
)

# Enable CORS for local frontend development and container networking
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }
