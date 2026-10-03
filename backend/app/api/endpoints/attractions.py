from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.attraction import Attraction
from app.schemas.attraction import (
    AttractionNameResponse,
    AttractionResponse,
    PlaceResponse,
)

router = APIRouter()

# Clean category mapping: replaces awkward raw backend/OSM names
# ("food and cuisine" -> "food", "alcohol" -> "nightlife", "landmarks" -> "history" / "viewpoint")
CLEAN_CATEGORY_MAP = {
    "food and cuisine": "food",
    "alcohol": "nightlife",
    "nature": "nature",
    "culture": "culture",
    "entertainment": "entertainment",
    "landmarks": "history",
}


def to_clean_category(db_category: str, monument_type: Optional[str] = None) -> str:
    """Transform internal DB category into clean, user-friendly frontend category."""
    if (monument_type or "").strip().lower() == "viewpoint":
        return "viewpoint"
    return CLEAN_CATEGORY_MAP.get(db_category, db_category)


def is_wheelchair_accessible(wheelchair: Optional[str]) -> bool:
    """
    Wheelchair mapping rule:
    'yes' / 'limited' (or 'designated') -> True
    'no' / null / anything else -> False
    """
    if not wheelchair:
        return False
    return wheelchair.strip().lower() in {"yes", "limited", "designated"}


def map_requested_category_to_db(clean_cat: str) -> Tuple[Optional[List[str]], Optional[str]]:
    """
    Translate clean frontend category back to DB categories and monument_type filter.
    Returns: (list_of_db_categories, monument_type_directive)
    """
    c = clean_cat.strip().lower()
    if c == "food":
        return (["food and cuisine"], None)
    if c in {"nightlife", "alcohol", "bars"}:
        return (["alcohol"], None)
    if c in {"history", "landmarks", "monuments"}:
        return (["landmarks"], "not_viewpoint")
    if c == "viewpoint":
        return (["landmarks"], "viewpoint")
    if c in {"nature", "culture", "entertainment"}:
        return ([c], None)
    # Direct fallback if raw DB category was passed
    return ([c], None)


def _parse_list_param(param: Optional[List[str]]) -> List[str]:
    """Helper to support both multiple query parameters and comma-separated values."""
    if not param:
        return []
    result = []
    for item in param:
        for part in item.split(","):
            val = part.strip()
            if val:
                result.append(val)
    return result


def serialize_attraction_to_place(attraction: Attraction) -> PlaceResponse:
    accessible = is_wheelchair_accessible(attraction.wheelchair)
    clean_cat = to_clean_category(attraction.category, attraction.monument_type)

    return PlaceResponse(
        id=attraction.id,
        name=attraction.name,
        description=attraction.description,
        latitude=attraction.latitude,
        longitude=attraction.longitude,
        category=clean_cat,
        isAccessible=accessible,
        durationMinutes=30,
        monument_type=attraction.monument_type,
        monument_subtype=attraction.monument_subtype,
        raw_category=attraction.category,
        wheelchair=attraction.wheelchair,
    )


@router.get("", response_model=List[PlaceResponse])
@router.get("/places", response_model=List[PlaceResponse])
def get_places(
    categories: Optional[List[str]] = Query(
        None,
        description="Filter by clean categories: food, nature, culture, history, viewpoint, nightlife, entertainment",
    ),
    exclude_categories: Optional[List[str]] = Query(
        None,
        description="Filter out unwanted categories",
    ),
    accessible_only: bool = Query(
        False,
        description="Filter only wheelchair accessible locations ('yes' or 'limited')",
    ),
    search: Optional[str] = Query(
        None,
        description="Search text in attraction name or description",
    ),
    
    limit: Optional[int] = Query(
        None,
        ge=1,
        le=2000,
        description="Max number of locations to return",
    ),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
):
    """
    Get locations formatted for the frontend (PlaceResponse).
    Includes complete filtering options to remove unwanted locations by:
    - categories or excluded categories
    - wheelchair accessibility
    - search query
    """
    query = db.query(Attraction)

    if accessible_only:
        query = query.filter(func.lower(Attraction.wheelchair).in_(["yes", "limited", "designated"]))

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Attraction.name.ilike(search_term),
                Attraction.description.ilike(search_term),
            )
        )

    parsed_categories = _parse_list_param(categories)
    if parsed_categories:
        cat_clauses = []
        for cat in parsed_categories:
            db_cats, req_type = map_requested_category_to_db(cat)
            if req_type == "viewpoint":
                cat_clauses.append(
                    and_(
                        Attraction.category.in_(db_cats or ["landmarks"]),
                        func.lower(Attraction.monument_type) == "viewpoint",
                    )
                )
            elif req_type == "not_viewpoint":
                cat_clauses.append(
                    and_(
                        Attraction.category.in_(db_cats or ["landmarks"]),
                        or_(
                            Attraction.monument_type.is_(None),
                            func.lower(Attraction.monument_type) != "viewpoint",
                        ),
                    )
                )
            elif db_cats:
                cat_clauses.append(Attraction.category.in_(db_cats))
        if cat_clauses:
            query = query.filter(or_(*cat_clauses))

    parsed_exclude_categories = _parse_list_param(exclude_categories)
    if parsed_exclude_categories:
        for exc_cat in parsed_exclude_categories:
            db_cats, req_type = map_requested_category_to_db(exc_cat)
            if req_type == "viewpoint":
                query = query.filter(
                    ~and_(
                        Attraction.category.in_(db_cats or ["landmarks"]),
                        func.lower(Attraction.monument_type) == "viewpoint",
                    )
                )
            elif req_type == "not_viewpoint":
                query = query.filter(
                    ~and_(
                        Attraction.category.in_(db_cats or ["landmarks"]),
                        or_(
                            Attraction.monument_type.is_(None),
                            func.lower(Attraction.monument_type) != "viewpoint",
                        ),
                    )
                )
            elif db_cats:
                query = query.filter(~Attraction.category.in_(db_cats))

    query = query.order_by(Attraction.name)
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)

    items = query.all()
    return [serialize_attraction_to_place(item) for item in items]


@router.get("/random", response_model=List[AttractionResponse])
def get_random_attractions(
    limit: int = Query(5, ge=1, le=50, description="Number of random attractions"),
    db: Session = Depends(get_db),
):
    """Return `limit` random attractions (default 5)."""
    return db.query(Attraction).order_by(func.random()).limit(limit).all()


@router.get("/names", response_model=List[AttractionNameResponse])
def get_all_attraction_names(
    distinct: bool = Query(False, description="Whether to return only unique entries"),
    db: Session = Depends(get_db),
):
    """Return every attraction name along with its category and monument_type."""
    query = db.query(
        Attraction.name,
        Attraction.category,
        Attraction.monument_type,
        Attraction.monument_subtype,
        Attraction.description,
        Attraction.wheelchair,
    )
    if distinct:
        query = query.distinct()
    rows = query.order_by(Attraction.name).all()
    return [
        AttractionNameResponse(
            name=name,
            description=description,
            category=category,
            monument_type=f"{monument_type} / {monument_subtype}" if monument_subtype else monument_type,
            category_display=f"{category} / {monument_type}" if monument_type else category,
            wheelchair=wheelchair,
        )
        for name, category, monument_type, monument_subtype, description, wheelchair in rows
    ]


@router.get("/names_unique", response_model=List[str])
def get_unique_attraction_subtypes(
    db: Session = Depends(get_db),
):
    """Return every unique monument_subtype."""
    query = db.query(Attraction.category, Attraction.monument_subtype).distinct()
    rows = query.order_by(Attraction.name).all()
    return [
        str(subtype) for category, subtype in rows if category != "food and cuisine" and subtype is not None
    ]
