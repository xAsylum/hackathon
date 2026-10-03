from datetime import datetime
from sqlalchemy import (
    JSON,
    BigInteger,
    Column,
    DateTime,
    Float,
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
    # toilets_wheelchair = Column(String(20), nullable=True)
    accessibility_tags = Column(JSON, nullable=True)

    # address = Column(String(255), nullable=True)
    # website = Column(String(500), nullable=True)
    # opening_hours = Column(String(255), nullable=True)
    # wikipedia = Column(String(255), nullable=True)
    # wikidata = Column(String(50), nullable=True)
    # image = Column(String(500), nullable=True)

    # tags = Column(JSON, nullable=False, default=dict)

    # created_at = Column(DateTime, default=datetime.utcnow)
    # updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
