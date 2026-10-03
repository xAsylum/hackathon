"""
Overpass API client for fetching Kraków places of interest.

Categories:
* nature
* landmarks
* culture
* entertainment
* food and cuisine
* alcohol
"""
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

USER_AGENT = "HackathonKrakowAttractions/0.1 (+https://github.com/xAsylum/hackathon)"

# OSM Values for the query
TOURISM_VALUES = [
    "attraction", "museum", "gallery", "viewpoint", "artwork",
    "zoo", "theme_park", "aquarium",
]
HISTORIC_VALUES = [
    "monument", "castle", "church", "chapel", "cathedral", "monastery",
    "archaeological_site", "ruins", "city_gate", "citywalls", "fort",
    "fortification", "tomb", "building", "manor", "palace", "tower", "bunker",
    "wayside_shrine", "mound", "heritage", "synagogue",
]
AMENITY_VALUES = [
    "bar", "pub", "biergarten", 
    "restaurant", "cafe", "fast_food", "food_court", "ice_cream", 
    "theatre", "arts_centre", "cinema", "nightclub"
]
LEISURE_VALUES = [
    "park", "nature_reserve", "garden", "water_park", "amusement_arcade", "escape_game"
]
NATURAL_VALUES = [
    "peak", "beach", "water", "wood", "lake"
]

WHEELCHAIR_VALUES = {"yes", "limited", "no", "designated"}
ACCESSIBILITY_KEY_PREFIXES = (
    "wheelchair", "ramp", "elevator", "lift", "tactile_paving",
    "blind", "deaf", "hearing_loop", "handrail", "step_count", "kerb", "entrance",
    "automatic_door", "door", "capacity:disabled", "disabled", "braille",
    "description:blind", "description:wheelchair",
)


def build_query(area_id: int, timeout: int) -> str:
    tourism_re = "|".join(TOURISM_VALUES)
    historic_re = "|".join(HISTORIC_VALUES)
    amenity_re = "|".join(AMENITY_VALUES)
    leisure_re = "|".join(LEISURE_VALUES)
    natural_re = "|".join(NATURAL_VALUES)
    
    return f"""
[out:json][timeout:{timeout}];
area(id:{area_id})->.krakow;
(
  nwr["tourism"~"^({tourism_re})$"]["name"](area.krakow);
  nwr["historic"~"^({historic_re})$"]["name"](area.krakow);
  nwr["historic"="memorial"]["memorial"!="plaque"]["name"](area.krakow);
  nwr["heritage"]["name"](area.krakow);
  nwr["amenity"~"^({amenity_re})$"]["name"](area.krakow);
  nwr["leisure"~"^({leisure_re})$"]["name"](area.krakow);
  nwr["natural"~"^({natural_re})$"]["name"](area.krakow);
);
out center tags;
""".strip()


def fetch_raw_elements(
    area_id: Optional[int] = None,
    urls: Optional[List[str]] = None,
    timeout: Optional[int] = None,
    retries_per_url: int = 2,
) -> List[Dict[str, Any]]:
    """Run the Overpass query, trying each mirror in turn. Returns raw `elements`."""
    area_id = area_id or settings.KRAKOW_AREA_ID
    urls = urls or settings.OVERPASS_URLS
    timeout = timeout or settings.OVERPASS_TIMEOUT
    query = build_query(area_id, timeout)

    last_error: Optional[Exception] = None
    for url in urls:
        for attempt in range(1, retries_per_url + 1):
            try:
                logger.info("Overpass request to %s (attempt %d)", url, attempt)
                resp = requests.post(
                    url,
                    data={"data": query},
                    headers={"User-Agent": USER_AGENT},
                    timeout=timeout + 30,
                )
                if resp.status_code in (429, 502, 503, 504):
                    raise requests.HTTPError(f"HTTP {resp.status_code}", response=resp)
                resp.raise_for_status()
                payload = resp.json()
                remark = payload.get("remark")
                if remark and "error" in remark.lower():
                    raise RuntimeError(f"Overpass runtime error: {remark}")
                elements = payload.get("elements", [])
                logger.info("Overpass returned %d elements", len(elements))
                return elements
            except (requests.RequestException, ValueError, RuntimeError) as exc:
                last_error = exc
                logger.warning("Overpass request to %s failed: %s", url, exc)
                time.sleep(5 * attempt)

    raise RuntimeError(f"All Overpass endpoints failed. Last error: {last_error}")


def _classify(tags: Dict[str, str]) -> Optional[Tuple[str, str]]:
    """Return (category, place_type) for an element, or None if it doesn't fit."""
    amenity = tags.get("amenity")
    tourism = tags.get("tourism")
    leisure = tags.get("leisure")
    natural = tags.get("natural")
    historic = tags.get("historic")

    # 1. Alcohol
    if amenity in {"bar", "pub", "biergarten"}:
        return "alcohol", amenity

    # 2. Food and cuisine
    if amenity in {"restaurant", "cafe", "fast_food", "food_court", "ice_cream"}:
        return "food and cuisine", amenity

    # 3. Entertainment
    if tourism in {"zoo", "theme_park", "aquarium"}:
        return "entertainment", tourism
    if amenity in {"cinema", "nightclub"}:
        return "entertainment", amenity
    if leisure in {"water_park", "amusement_arcade", "escape_game"}:
        return "entertainment", leisure

    # 4. Culture
    if tourism in {"museum", "gallery", "artwork"}:
        return "culture", tourism
    if amenity in {"theatre", "arts_centre"}:
        return "culture", amenity

    # 5. Nature
    if leisure in {"park", "nature_reserve", "garden"}:
        return "nature", leisure
    if natural in NATURAL_VALUES:
        return "nature", natural
        
    # 6. Landmarks
    if tourism in {"attraction", "viewpoint"}:
        return "landmarks", tourism
    if historic and historic != "yes":
        return "landmarks", historic
    if "heritage" in tags:
        return "landmarks", "heritage"

    return None


def _subtype(place_type: str, tags: Dict[str, str]) -> Optional[str]:
    if place_type in {"restaurant", "cafe", "fast_food", "food_court"}:
        return tags.get("cuisine") or tags.get("diet:vegan") and "vegan"
    if place_type in {"pub", "bar"}:
        return tags.get("brewery") or tags.get("cuisine")
        
    # Standard fallback
    return tags.get(f"{place_type}_type") or tags.get(place_type)



def _accessibility_tags(tags: Dict[str, str]) -> Optional[Dict[str, str]]:
    found = {k: v for k, v in tags.items() if k.startswith(ACCESSIBILITY_KEY_PREFIXES)}
    return found or None


def _normalize_wheelchair(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.strip().lower()
    return value if value in WHEELCHAIR_VALUES else None


def parse_element(element: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Convert a raw Overpass element into kwargs for the Attraction model."""
    tags: Dict[str, str] = element.get("tags") or {}
    name = tags.get("name")
    if not name:
        return None

    if "lat" in element and "lon" in element:
        lat, lon = element["lat"], element["lon"]
    elif "center" in element:
        lat, lon = element["center"]["lat"], element["center"]["lon"]
    else:
        return None

    classification = _classify(tags)
    if classification is None:
        return None
    category, place_type = classification

    desc_parts = []
    if base_desc := tags.get("description:en") or tags.get("description"):
        desc_parts.append(base_desc)
        
    compiled_description = "\n".join(desc_parts) if desc_parts else None

    return {
        "id": element["id"],
        "name": name[:255],
        "description": compiled_description,
        "latitude": lat,
        "longitude": lon,
        "category": category,
        "monument_type": place_type,
        "monument_subtype": _subtype(place_type, tags),
        "wheelchair": _normalize_wheelchair(tags.get("wheelchair")),
        "accessibility_tags": _accessibility_tags(tags),
    }


def fetch_krakow_attractions() -> List[Dict[str, Any]]:
    """Fetch and parse all Kraków attractions. Deduplicated by (osm_type, osm_id)."""
    parsed: Dict[Tuple[str, int], Dict[str, Any]] = {}
    for element in fetch_raw_elements():
        item = parse_element(element)
        if item:
            parsed[(item["id"])] = item
    return list(parsed.values())