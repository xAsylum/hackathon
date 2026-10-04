from app.scripts.seed_attractions import seed_on_startup
from app.scripts.seed_featured_likes import seed_featured_likes
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.db.session import engine, Base
import app.db.base  # ensure models are imported


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_dir = os.path.dirname(settings.DATABASE_URL.removeprefix("sqlite:///"))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    if settings.SEED_ATTRACTIONS_ON_STARTUP:
        seed_on_startup()
        
    # Load NetworkX Graph for green routing
    import osmnx as ox
    graph_path = "/app/data/krakow_green.graphml" if os.environ.get("DATABASE_URL") else "data/krakow_green.graphml" # Docker vs Local path handling
    if os.path.exists(graph_path):
        print(f"Loading routing graph from {graph_path}...")
        try:
            app.state.graph = ox.load_graphml(graph_path)
            print("Graph loaded successfully.")
        except Exception as e:
            print(f"Failed to load graph: {e}")
            app.state.graph = None
    else:
        print(f"Warning: {graph_path} not found. Run the green_score_krakow.py script first.")
        app.state.graph = None
        
    seed_featured_likes()
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
