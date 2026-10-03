"""
Overpass API client for fetching Kraków monuments / tourist attractions.

How OSM data is stored (relevant for the query below):
  * Elements are `node` (a point), `way` (an ordered list of nodes - e.g. a building
    outline) or `relation` (a group of elements - e.g. a castle complex).
  * Semantics live in free-form key=value `tags`. Attractions are described by keys like
    `tourism=*` (museum, attraction, viewpoint...), `historic=*` (castle, monument,
    memorial, church...) and `heritage=*` (officially protected monument / "zabytek").
  * Accessibility uses `wheelchair=yes|limited|no|designated`, `wheelchair:description`,
    `toilets:wheelchair`, plus less common keys (ramp, tactile_paving, blind:*, deaf:*...).

Query strategy (Kraków has millions of nodes, so we filter server-side):
  * Restrict to the Kraków admin boundary area (area id = 3600000000 + relation id).
  * Only request elements carrying the tourism/historic/heritage values we care about
    AND a `name` (unnamed objects are useless in a list / map UI).
  * Skip `memorial=plaque` (hundreds of small wall plaques).
  * `out center tags` returns tags + a single center coordinate for ways/relations,
    instead of their full geometry - keeps the response small (~1.2k elements).
"""
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

USER_AGENT = "HackathonKrakowAttractions/0.1 (+https://github.com/xAsylum/hackathon)"

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

# Tourism values that describe the place better than its historic tag
# (a museum inside a historic building is primarily a museum).
PRIMARY_TOURISM = {"museum", "gallery", "zoo", "theme_park", "aquarium", "viewpoint"}
# Historic values that are too generic to be the main type if something better exists.
GENERIC_HISTORIC = {"yes", "building", "heritage"}

WHEELCHAIR_VALUES = {"yes", "limited", "no", "designated"}
ACCESSIBILITY_KEY_PREFIXES = (
    "wheelchair", "toilets:wheelchair", "ramp", "elevator", "lift", "tactile_paving",
    "blind", "deaf", "hearing_loop", "handrail", "step_count", "kerb", "entrance",
    "automatic_door", "door", "capacity:disabled", "disabled", "braille",
    "description:blind", "description:wheelchair",
)


def build_query(area_id: int, timeout: int) -> str:
    tourism_re = "|".join(TOURISM_VALUES)
    historic_re = "|".join(HISTORIC_VALUES)
    return f"""
[out:json][timeout:{timeout}];
area(id:{area_id})->.krakow;
(
  nwr["tourism"~"^({tourism_re})$"]["name"](area.krakow);
  nwr["historic"~"^({historic_re})$"]["name"](area.krakow);
  nwr["historic"="memorial"]["memorial"!="plaque"]["name"](area.krakow);
  nwr["heritage"]["name"](area.krakow);
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
                # 429 = rate limited, 504 = server overloaded -> back off and retry
                if resp.status_code in (429, 502, 503, 504):
                    raise requests.HTTPError(f"HTTP {resp.status_code}", response=resp)
                resp.raise_for_status()
                payload = resp.json()
                # Overpass may return 200 with a runtime error in `remark` (e.g. timeout)
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
    """Return (category, monument_type) for an element, or None if it doesn't fit."""
    tourism = tags.get("tourism")
    historic = tags.get("historic")

    if tourism in PRIMARY_TOURISM:
        return "tourism", tourism
    if historic and historic not in GENERIC_HISTORIC:
        return "historic", historic
    if tourism in TOURISM_VALUES:
        return "tourism", tourism
    if historic and historic != "yes":
        return "historic", historic
    if "heritage" in tags:
        for key in ("amenity", "building"):
            value = tags.get(key)
            if value and value != "yes":
                return "heritage", value
        return "heritage", "heritage"
    return None


def _subtype(monument_type: str, tags: Dict[str, str]) -> Optional[str]:
    # e.g. artwork_type=sculpture, castle_type=defensive, memorial=statue, museum=history
    return tags.get(f"{monument_type}_type") or tags.get(monument_type)


def _address(tags: Dict[str, str]) -> Optional[str]:
    street = tags.get("addr:street") or tags.get("addr:place")
    if not street:
        return None
    number = tags.get("addr:housenumber")
    return f"{street} {number}" if number else street


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

    # Nodes carry lat/lon directly; ways/relations carry `center` thanks to `out center`
    if "lat" in element and "lon" in element:
        lat, lon = element["lat"], element["lon"]
    elif "center" in element:
        lat, lon = element["center"]["lat"], element["center"]["lon"]
    else:
        return None

    classification = _classify(tags)
    if classification is None:
        return None
    category, monument_type = classification

    return {
        "osm_type": element["type"],
        "osm_id": element["id"],
        "name": name[:255],
        "description": tags.get("description:en") or tags.get("description"),
        "latitude": lat,
        "longitude": lon,
        "category": category,
        "monument_type": monument_type,
        "monument_subtype": _subtype(monument_type, tags),
        "wheelchair": _normalize_wheelchair(tags.get("wheelchair")),
        "wheelchair_description": tags.get("wheelchair:description:en")
        or tags.get("wheelchair:description"),
        "toilets_wheelchair": _normalize_wheelchair(tags.get("toilets:wheelchair")),
        "accessibility_tags": _accessibility_tags(tags),
        "address": _address(tags),
        "website": tags.get("website") or tags.get("contact:website") or tags.get("url"),
        "opening_hours": tags.get("opening_hours"),
        "wikipedia": tags.get("wikipedia"),
        "wikidata": tags.get("wikidata"),
        "image": tags.get("image") or tags.get("wikimedia_commons"),
        "tags": tags,
    }


def fetch_krakow_attractions() -> List[Dict[str, Any]]:
    """Fetch and parse all Kraków attractions. Deduplicated by (osm_type, osm_id)."""
    parsed: Dict[Tuple[str, int], Dict[str, Any]] = {}
    for element in fetch_raw_elements():
        item = parse_element(element)
        if item:
            parsed[(item["osm_type"], item["osm_id"])] = item
    return list(parsed.values())
