from fastapi import APIRouter
from app.api.endpoints import attractions, routing

api_router = APIRouter()


@api_router.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


api_router.include_router(attractions.router, prefix="/attractions", tags=["Attractions"])
api_router.include_router(routing.router, prefix="/routing", tags=["Routing"])
api_router.include_router(routing.router, prefix="/route", tags=["Route"])
api_router.add_api_route(
    "/places",
    attractions.get_places,
    methods=["GET"],
    response_model=attractions.List[attractions.PlaceResponse],
    tags=["Places"],
    summary="Get places formatted for frontend with filter options",
)
