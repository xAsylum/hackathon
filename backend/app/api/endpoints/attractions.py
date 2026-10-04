from typing import Dict, List, Optional, Set, Tuple
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import func, or_, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.attraction import Attraction, AttractionLike
from app.schemas.attraction import (
    AttractionLikeResponse,
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


def serialize_attraction_to_place(
    attraction: Attraction,
    likes_count: int = 0,
    liked: bool = False,
) -> PlaceResponse:
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
        likes_count=likes_count,
        liked=liked,
    )


def get_like_state(
    db: Session,
    attraction_ids: List[int],
    visitor_id: Optional[str],
) -> Tuple[Dict[int, int], Set[int]]:
    if not attraction_ids:
        return {}, set()

    count_rows = (
        db.query(
            AttractionLike.attraction_id,
            func.count(AttractionLike.id),
        )
        .filter(AttractionLike.attraction_id.in_(attraction_ids))
        .group_by(AttractionLike.attraction_id)
        .all()
    )
    counts = {attraction_id: count for attraction_id, count in count_rows}

    liked_ids: Set[int] = set()
    if visitor_id:
        liked_ids = {
            attraction_id
            for (attraction_id,) in (
                db.query(AttractionLike.attraction_id)
                .filter(
                    AttractionLike.attraction_id.in_(attraction_ids),
                    AttractionLike.visitor_id == visitor_id,
                )
                .all()
            )
        }

    return counts, liked_ids


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
    visitor_id: Optional[str] = Header(None, alias="X-Visitor-Id"),
    db: Session = Depends(get_db),
):
    """
    Get locations formatted for the frontend (PlaceResponse).
    Includes complete filtering options to remove unwanted locations by:
    - categories or excluded categories
    - wheelchair accessibility
    - search query
    """
    like_counts = (
        db.query(
            AttractionLike.attraction_id.label("attraction_id"),
            func.count(AttractionLike.id).label("likes_count"),
        )
        .group_by(AttractionLike.attraction_id)
        .subquery()
    )
    query = db.query(Attraction).outerjoin(
        like_counts,
        Attraction.id == like_counts.c.attraction_id,
    )

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

    query = query.order_by(
        func.coalesce(like_counts.c.likes_count, 0).desc(),
        Attraction.name,
    )
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)

    items = query.all()
    counts, liked_ids = get_like_state(
        db,
        [item.id for item in items],
        visitor_id,
    )
    return [
        serialize_attraction_to_place(
            item,
            likes_count=counts.get(item.id, 0),
            liked=item.id in liked_ids,
        )
        for item in items
    ]


@router.put("/{attraction_id}/like", response_model=AttractionLikeResponse)
def like_attraction(
    attraction_id: int,
    visitor_id: str = Header(
        ...,
        alias="X-Visitor-Id",
        min_length=1,
        max_length=64,
    ),
    db: Session = Depends(get_db),
):
    attraction = db.query(Attraction.id).filter(Attraction.id == attraction_id).first()
    if attraction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attraction not found",
        )

    existing_like = (
        db.query(AttractionLike.id)
        .filter(
            AttractionLike.attraction_id == attraction_id,
            AttractionLike.visitor_id == visitor_id,
        )
        .first()
    )
    if existing_like is None:
        db.add(
            AttractionLike(
                attraction_id=attraction_id,
                visitor_id=visitor_id,
            )
        )
        try:
            db.commit()
        except IntegrityError:
            # Idempotent response when two tabs like at the same time.
            db.rollback()

    likes_count = (
        db.query(func.count(AttractionLike.id))
        .filter(AttractionLike.attraction_id == attraction_id)
        .scalar()
    )
    return AttractionLikeResponse(
        attraction_id=attraction_id,
        likes_count=likes_count or 0,
        liked=True,
    )


@router.delete("/{attraction_id}/like", response_model=AttractionLikeResponse)
def unlike_attraction(
    attraction_id: int,
    visitor_id: str = Header(
        ...,
        alias="X-Visitor-Id",
        min_length=1,
        max_length=64,
    ),
    db: Session = Depends(get_db),
):
    attraction = db.query(Attraction.id).filter(Attraction.id == attraction_id).first()
    if attraction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attraction not found",
        )

    db.query(AttractionLike).filter(
        AttractionLike.attraction_id == attraction_id,
        AttractionLike.visitor_id == visitor_id,
    ).delete(synchronize_session=False)
    db.commit()

    likes_count = (
        db.query(func.count(AttractionLike.id))
        .filter(AttractionLike.attraction_id == attraction_id)
        .scalar()
    )
    return AttractionLikeResponse(
        attraction_id=attraction_id,
        likes_count=likes_count or 0,
        liked=False,
    )


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
