from typing import Dict, Optional
from pydantic import BaseModel, ConfigDict


class AttractionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    category: str
    monument_type: str
    monument_subtype: Optional[str] = None
    wheelchair: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttractionNameResponse(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    monument_type: Optional[str] = None
    category_display: Optional[str] = None
    wheelchair: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PlaceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    category: str
    isAccessible: bool
    durationMinutes: int = 30
    monument_type: Optional[str] = None
    monument_subtype: Optional[str] = None
    raw_category: Optional[str] = None
    wheelchair: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
