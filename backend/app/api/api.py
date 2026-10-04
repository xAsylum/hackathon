from fastapi import APIRouter
from app.api.endpoints import attractions, routing

api_router = APIRouter()


@api_router.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


api_router.include_router(attractions.router, prefix="/attractions", tags=["Attractions"])
api_router.include_router(routing.router, prefix="/routing", tags=["Routing"])
