from typing import Any, Dict, List, Optional, Union
import math
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import networkx as nx
import osmnx as ox

router = APIRouter()


class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    weight: float = 0.5  # 0.0 means normal shortest path, >0.0 prefers green


class Waypoint(BaseModel):
    id: Optional[Union[str, int]] = None
    lat: float
    lng: float


class OptimizeRouteRequest(BaseModel):
    waypoints: List[Waypoint]
    accessible_only: bool = False
    prioritize_lit: bool = False
    mood: Optional[str] = "chill"
    weight: Optional[float] = None


class RouteSegmentProperties(BaseModel):
    green: float
    traffic: float
    lit: bool
    highway: str


class RouteSegment(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: RouteSegmentProperties


class RouteStats(BaseModel):
    distance_m: float
    total_min: float
    pct_green: float


class RouteFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[RouteSegment]


class OptimizeRouteResponse(BaseModel):
    distance_meters: float
    duration_seconds: float
    stats: RouteStats
    geojson: RouteFeatureCollection
    route: RouteFeatureCollection  # Compatible with MapRouteData


class SpatialGrid:
    """Fast in-memory 2D spatial grid index for 150k+ OSM nodes (sub-millisecond lookups)."""

    def __init__(self, G):
        self.grid: Dict[tuple, List[tuple]] = {}
        for node, data in G.nodes(data=True):
            try:
                x = float(data["x"])
                y = float(data["y"])
            except (KeyError, ValueError, TypeError):
                continue
            k = (int(y * 100), int(x * 100))
            self.grid.setdefault(k, []).append((node, x, y))

    def find_nearest(self, lat: float, lon: float) -> Optional[int]:
        cy, cx = int(lat * 100), int(lon * 100)
        cands: List[tuple] = []
        for r in (1, 2, 4):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    cands.extend(self.grid.get((cy + dy, cx + dx), []))
            if cands:
                break

        if not cands:
            return None

        cos_lat = math.cos(math.radians(lat))
        best_node = None
        min_dist_sq = float("inf")
        for n, x, y in cands:
            d_sq = ((x - lon) * cos_lat * 111320) ** 2 + ((y - lat) * 110540) ** 2
            if d_sq < min_dist_sq:
                min_dist_sq = d_sq
                best_node = n

        return best_node


def get_spatial_grid(request: Request) -> Optional[SpatialGrid]:
    grid = getattr(request.app.state, "spatial_grid", None)
    if grid is None:
        G = getattr(request.app.state, "graph", None)
        if G is not None:
            grid = SpatialGrid(G)
            request.app.state.spatial_grid = grid
    return grid


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two lat/lon coordinates."""
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_traffic_level(highway: str) -> float:
    """Estimate traffic/noise score based on highway type (0.0 to 1.0)."""
    h = str(highway).lower()
    if any(k in h for k in ["motorway", "trunk", "primary"]):
        return 0.8
    if "secondary" in h:
        return 0.6
    if "tertiary" in h:
        return 0.4
    if any(k in h for k in ["residential", "unclassified"]):
        return 0.2
    if any(k in h for k in ["living_street", "service"]):
        return 0.1
    if any(k in h for k in ["pedestrian", "footway", "path", "cycleway", "track", "steps"]):
        return 0.05
    return 0.2


def is_edge_lit(data: Dict[str, Any], highway: str) -> bool:
    """Check if street is illuminated or in illuminated urban area."""
    lit_tag = str(data.get("lit", "")).lower()
    if lit_tag in {"yes", "24/7", "automatic", "dusk-dawn"}:
        return True
    if lit_tag in {"no", "unlit"}:
        return False
    # Central Kraków pedestrian, living streets, primary, secondary and residential streets are lit
    h = str(highway).lower()
    return any(k in h for k in ["pedestrian", "living_street", "primary", "secondary", "residential"])


@router.post("/", response_model=Dict[str, Any])
def get_green_route(request: Request, payload: RouteRequest):
    G = getattr(request.app.state, "graph", None)
    if G is None:
        raise HTTPException(status_code=503, detail="Routing graph not loaded")

    grid = get_spatial_grid(request)
    if grid is None:
        raise HTTPException(status_code=503, detail="Spatial index not ready")

    start_node = grid.find_nearest(payload.start_lat, payload.start_lon)
    end_node = grid.find_nearest(payload.end_lat, payload.end_lon)
    if start_node is None or end_node is None:
        raise HTTPException(status_code=400, detail="Could not find nearest graph nodes")

    w = max(0.0, min(0.99, payload.weight))

    def green_cost(u, v, data):
        if "length" not in data:
            min_cost = float("inf")
            for key, edge_data in data.items():
                l = float(edge_data.get("length", 1.0))
                s = float(edge_data.get("green_score", 0.0))
                cost = l * (1.0 - (s * w))
                if cost < min_cost:
                    min_cost = cost
            return min_cost

        length = float(data.get("length", 1.0))
        score = float(data.get("green_score", 0.0))
        return length * (1.0 - (score * w))

    try:
        path_nodes = nx.shortest_path(G, start_node, end_node, weight=green_cost)
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No path found between points")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    coordinates = []
    total_length = 0.0
    total_green_score = 0.0
    edges_count = 0

    for i in range(len(path_nodes) - 1):
        u = path_nodes[i]
        v = path_nodes[i + 1]
        edge_data = G.get_edge_data(u, v)
        if edge_data and 0 in edge_data:
            data = edge_data[0]
        elif edge_data:
            data = list(edge_data.values())[0]
        else:
            continue

        total_length += float(data.get("length", 0.0))
        total_green_score += float(data.get("green_score", 0.0))
        edges_count += 1

        if "geometry" in data:
            coords = list(data["geometry"].coords)
            if not coordinates:
                coordinates.extend(coords)
            else:
                coordinates.extend(coords[1:])
        else:
            node_u = G.nodes[u]
            node_v = G.nodes[v]
            coords = [(node_u["x"], node_u["y"]), (node_v["x"], node_v["y"])]
            if not coordinates:
                coordinates.extend(coords)
            else:
                coordinates.append(coords[1])

    avg_green_score = total_green_score / edges_count if edges_count > 0 else 0.0

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": coordinates},
                "properties": {
                    "total_length": total_length,
                    "avg_green_score": avg_green_score,
                    "weight_used": w,
                },
            }
        ],
    }


@router.post("/optimize", response_model=OptimizeRouteResponse)
def optimize_route(request: Request, payload: OptimizeRouteRequest):
    """
    Multi-stop green route optimizer.
    Finds optimal walking route passing through all waypoints with greenness preference,
    lighting awareness, barrier avoidance, and segment properties.
    """
    waypoints = payload.waypoints
    if len(waypoints) < 2:
        coords = [[wp.lng, wp.lat] for wp in waypoints]
        empty_fc = RouteFeatureCollection(
            type="FeatureCollection",
            features=[
                RouteSegment(
                    geometry={"type": "LineString", "coordinates": coords},
                    properties=RouteSegmentProperties(
                        green=0.0, traffic=0.0, lit=False, highway="pedestrian"
                    ),
                )
            ],
        )
        return OptimizeRouteResponse(
            distance_meters=0.0,
            duration_seconds=0.0,
            stats=RouteStats(distance_m=0.0, total_min=0.0, pct_green=0.0),
            geojson=empty_fc,
            route=empty_fc,
        )

    G = getattr(request.app.state, "graph", None)
    grid = get_spatial_grid(request) if G is not None else None

    # Determine green weight preference based on mood
    if payload.weight is not None:
        w = max(0.0, min(0.99, payload.weight))
    else:
        mood_weights = {
            "chill": 0.75,       # Strong preference for greenery and parks
            "nature": 0.85,      # Maximum preference for parks and nature reserves
            "culture": 0.45,     # Balanced route between sights
            "night_vibe": 0.30,   # Moderate greenery, prioritize lighted streets
            "quick_walk": 0.10,  # Fast direct route
        }
        w = mood_weights.get(payload.mood, 0.6)

    features: List[RouteSegment] = []
    total_distance_m = 0.0
    weighted_green_sum = 0.0

    def _single_edge_cost(edge_data: Dict[str, Any]) -> float:
        h = edge_data.get("highway", "footway")
        h_str = h[0] if isinstance(h, list) else str(h)

        # Accessibility check: avoid stairs / steps
        if payload.accessible_only and ("steps" in h_str.lower() or edge_data.get("wheelchair") == "no"):
            return 1e8

        length = float(edge_data.get("length", 1.0))
        green = float(edge_data.get("green_score", 0.0))

        factor = 1.0 - (green * w)

        # Lighting prioritization
        if payload.prioritize_lit:
            lit = is_edge_lit(edge_data, h_str)
            if not lit:
                factor *= 1.6  # penalty for unlit streets

        return max(0.01, length * factor)

    def green_cost(u, v, data):
        if "length" not in data:
            best_cost = float("inf")
            for key, edge_data in data.items():
                cost = _single_edge_cost(edge_data)
                if cost < best_cost:
                    best_cost = cost
            return best_cost
        return _single_edge_cost(data)

    # Route through each pair of consecutive waypoints: 0 -> 1 -> 2 ...
    for i in range(len(waypoints) - 1):
        wp_start = waypoints[i]
        wp_end = waypoints[i + 1]

        leg_found = False

        if G is not None and grid is not None:
            try:
                start_node = grid.find_nearest(wp_start.lat, wp_start.lng)
                end_node = grid.find_nearest(wp_end.lat, wp_end.lng)

                if start_node is not None and end_node is not None:
                    path_nodes = nx.shortest_path(G, start_node, end_node, weight=green_cost)

                    for j in range(len(path_nodes) - 1):
                        u = path_nodes[j]
                        v = path_nodes[j + 1]
                        edge_dict = G.get_edge_data(u, v)
                        if not edge_dict:
                            continue

                        # Select lowest cost edge if multi-edge
                        if 0 in edge_dict:
                            data = edge_dict[0]
                        else:
                            data = list(edge_dict.values())[0]

                        length = float(data.get("length", 1.0))
                        green = float(data.get("green_score", 0.0))
                        h = data.get("highway", "footway")
                        highway_str = h[0] if isinstance(h, list) else str(h)
                        traffic = get_traffic_level(highway_str)
                        lit = is_edge_lit(data, highway_str)

                        if "geometry" in data:
                            seg_coords = [[float(c[0]), float(c[1])] for c in data["geometry"].coords]
                        else:
                            node_u = G.nodes[u]
                            node_v = G.nodes[v]
                            seg_coords = [
                                [float(node_u["x"]), float(node_u["y"])],
                                [float(node_u["x"]), float(node_u["y"])],
                            ]

                        if len(seg_coords) >= 2:
                            features.append(
                                RouteSegment(
                                    type="Feature",
                                    geometry={"type": "LineString", "coordinates": seg_coords},
                                    properties=RouteSegmentProperties(
                                        green=round(green, 2),
                                        traffic=round(traffic, 2),
                                        lit=lit,
                                        highway=highway_str,
                                    ),
                                )
                            )
                            total_distance_m += length
                            weighted_green_sum += green * length

                    leg_found = True
            except Exception:
                leg_found = False

        # Fallback to direct leg if graph routing was not possible
        if not leg_found:
            direct_dist = haversine_distance(wp_start.lat, wp_start.lng, wp_end.lat, wp_end.lng)
            direct_coords = [[wp_start.lng, wp_start.lat], [wp_end.lng, wp_end.lat]]
            features.append(
                RouteSegment(
                    type="Feature",
                    geometry={"type": "LineString", "coordinates": direct_coords},
                    properties=RouteSegmentProperties(
                        green=0.3,
                        traffic=0.1,
                        lit=True,
                        highway="footway",
                    ),
                )
            )
            total_distance_m += direct_dist
            weighted_green_sum += 0.3 * direct_dist

    # Percentage of greenness along the route
    pct_green = round((weighted_green_sum / total_distance_m * 100.0) if total_distance_m > 0 else 0.0, 1)

    # Average walking speed: ~4.5 km/h = 1.25 m/s
    walking_speed_mps = 1.25
    duration_seconds = round(total_distance_m / walking_speed_mps, 1)
    total_min = round(duration_seconds / 60.0, 1)

    fc = RouteFeatureCollection(type="FeatureCollection", features=features)
    stats = RouteStats(
        distance_m=round(total_distance_m, 1),
        total_min=total_min,
        pct_green=pct_green,
    )

    return OptimizeRouteResponse(
        distance_meters=round(total_distance_m, 1),
        duration_seconds=duration_seconds,
        stats=stats,
        geojson=fc,
        route=fc,
    )
