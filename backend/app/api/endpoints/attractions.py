from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.attraction import Attraction
from app.schemas.attraction import AttractionNameResponse, AttractionResponse

router = APIRouter()


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
    query = db.query(Attraction.name, Attraction.category, Attraction.monument_type)
    if distinct:
        query = query.distinct()
    rows = query.order_by(Attraction.name).all()
    return [
        AttractionNameResponse(
            name=name,
            category=category,
            monument_type=monument_type,
            category_display=f"{category} / {monument_type}" if monument_type else category,
        )
        for name, category, monument_type in rows
    ]


