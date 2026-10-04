from datetime import datetime
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from app.db.session import Base


class Attraction(Base):
    """A monument / tourist attraction in Kraków sourced from OpenStreetMap (Overpass API)."""

    __tablename__ = "attractions"
    __table_args__ = (
        Index("ix_attraction_lat_lon", "latitude", "longitude"),
    )
    id = Column(Integer, primary_key=True, index=True, nullable=False)

    # Basic info
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    category = Column(String(50), nullable=False, index=True)
    monument_type = Column(String(100), nullable=False, index=True)
    monument_subtype = Column(String(100), nullable=True)

    wheelchair = Column(String(20), nullable=True, index=True)


class AttractionLike(Base):
    """One anonymous browser vote for an attraction."""

    __tablename__ = "attraction_likes"
    __table_args__ = (
        UniqueConstraint(
            "attraction_id",
            "visitor_id",
            name="uq_attraction_like_visitor",
        ),
        Index("ix_attraction_likes_attraction_id", "attraction_id"),
    )

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    attraction_id = Column(
        Integer,
        ForeignKey("attractions.id", ondelete="CASCADE"),
        nullable=False,
    )
    visitor_id = Column(String(64), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)