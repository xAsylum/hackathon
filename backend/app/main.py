from app.scripts.seed_attractions import seed_on_startup
import os
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.db.session import engine, Base
import app.db.base  # ensure models are imported


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure SQLite directory exists
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_dir = os.path.dirname(settings.DATABASE_URL.removeprefix("sqlite:///"))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
    # Create tables automatically on startup
    Base.metadata.create_all(bind=engine)
    # Fill attractions from Overpass if the table is empty (non-blocking)
    if settings.SEED_ATTRACTIONS_ON_STARTUP:
        seed_on_startup()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "random_attractions": f"{settings.API_V1_STR}/attractions/random",
        "attraction_names": f"{settings.API_V1_STR}/attractions/names",
    }
