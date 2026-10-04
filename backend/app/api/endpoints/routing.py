from fastapi import APIRouter, HTTPException, Request, Query
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

@router.post("/")
def get_green_route(request: Request, payload: RouteRequest):
    G = request.app.state.graph
    if G is None:
        raise HTTPException(status_code=503, detail="Routing graph not loaded")

    # Ensure weight is within safe bounds (0 to 0.99)
    w = max(0.0, min(0.99, payload.weight))

    # Find nearest nodes
    try:
        start_node = ox.distance.nearest_nodes(G, X=payload.start_lon, Y=payload.start_lat)
        end_node = ox.distance.nearest_nodes(G, X=payload.end_lon, Y=payload.end_lat)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not find nearest nodes: {e}")

    # Define custom cost function
    def green_cost(u, v, data):
        # Depending on OSMnx version, data might be a dict directly or contained in a multi-graph key
        # Handle multi-graph structure correctly (we just take the first edge between u, v)
        if 'length' not in data:
            # MultiGraph case: data is actually a dict of edges
            # We take the lowest cost edge
            min_cost = float('inf')
            for key, edge_data in data.items():
                l = edge_data.get('length', 1.0)
                s = float(edge_data.get('green_score', 0.0))
                cost = l * (1.0 - (s * w))
                if cost < min_cost:
                    min_cost = cost
            return min_cost
        
        # DiGraph case
        length = data.get('length', 1.0)
        score = float(data.get('green_score', 0.0))
        return length * (1.0 - (score * w))

    try:
        # Calculate shortest path
        path_nodes = nx.shortest_path(G, start_node, end_node, weight=green_cost)
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No path found between points")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Extract geometry for the path
    coordinates = []
    total_length = 0.0
    total_green_score = 0.0
    edges_count = 0

    for i in range(len(path_nodes) - 1):
        u = path_nodes[i]
        v = path_nodes[i+1]
        
        # Get edge data (MultiDiGraph)
        edge_data = G.get_edge_data(u, v)
        # Take the first edge (key 0)
        if edge_data and 0 in edge_data:
            data = edge_data[0]
        elif edge_data:
            data = list(edge_data.values())[0]
        else:
            continue

        total_length += data.get('length', 0.0)
        total_green_score += float(data.get('green_score', 0.0))
        edges_count += 1

        if 'geometry' in data:
            # geometry is a shapely LineString
            coords = list(data['geometry'].coords)
            # Add to coordinates list, avoiding duplicates at connection points
            if not coordinates:
                coordinates.extend(coords)
            else:
                coordinates.extend(coords[1:])
        else:
            # If no geometry, just use node coordinates
            node_u = G.nodes[u]
            node_v = G.nodes[v]
            coords = [(node_u['x'], node_u['y']), (node_v['x'], node_v['y'])]
            if not coordinates:
                coordinates.extend(coords)
            else:
                coordinates.append(coords[1])

    avg_green_score = total_green_score / edges_count if edges_count > 0 else 0.0

    # Build GeoJSON response
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                },
                "properties": {
                    "total_length": total_length,
                    "avg_green_score": avg_green_score,
                    "weight_used": w
                }
            }
        ]
    }

    return geojson
