from typing import Dict, Optional
from pydantic import BaseModel, ConfigDict


class AttractionResponse(BaseModel):
    id: int
    osm_type: str
    osm_id: int
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    category: str
    monument_type: str
    monument_subtype: Optional[str] = None
    wheelchair: Optional[str] = None
    wheelchair_description: Optional[str] = None
    toilets_wheelchair: Optional[str] = None
    accessibility_tags: Optional[Dict[str, str]] = None
    address: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[str] = None
    wikipedia: Optional[str] = None
    wikidata: Optional[str] = None
    image: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttractionNameResponse(BaseModel):
    name: str
    category: str
    monument_type: Optional[str] = None
    category_display: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

