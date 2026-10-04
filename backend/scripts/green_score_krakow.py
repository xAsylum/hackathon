"""
Udział zieleni OSM w buforze wokół odcinków dróg (Kraków).

Wymagania:  pip install osmnx geopandas matplotlib
Uruchomienie: python green_score_krakow.py
Pierwsze uruchomienie pobiera dane z Overpass (kilka minut), potem działa z cache OSMnx.
"""
import osmnx as ox
import geopandas as gpd
import os

PLACE = "Kraków, Poland"
BUFFER_M = 50          # promień bufora wokół odcinka
RIVER_WIDTH_M = 15     # rzeki są liniami, więc je "pogrubiamy"
CRS = "EPSG:2180"      # polski układ metryczny (PL-1992)

# --- 1. Graf dróg (dla pieszych) -> tabela odcinków -------------------------
print("Pobieranie grafu dróg dla:", PLACE)
G = ox.graph_from_place(PLACE, network_type="walk")
G_proj = ox.project_graph(G, to_crs=CRS)
edges = ox.graph_to_gdfs(G_proj, nodes=False).reset_index()
edges["eid"] = edges.index

# --- 2. Zieleń i woda z OSM --------------------------------------------------
print("Pobieranie terenów zielonych z OSM...")
TAGS = {
    "leisure": ["park", "garden", "nature_reserve"],
    "landuse": ["forest", "meadow", "grass", "village_green", "recreation_ground"],
    "natural": ["wood", "scrub", "grassland", "wetland", "water"],
    "waterway": ["river"],
}
feat = ox.features_from_place(PLACE, TAGS).to_crs(CRS)

# poligony (parki, lasy, łąki, jeziora...)
polys = feat[feat.geom_type.isin(["Polygon", "MultiPolygon"])].copy()
polys["geometry"] = polys.geometry.make_valid()

# rzeki to linie -> bufor, żeby miały powierzchnię
rivers = feat[feat.geom_type.isin(["LineString", "MultiLineString"])]
rivers = rivers[rivers.get("waterway") == "river"]
river_polys = rivers.geometry.buffer(RIVER_WIDTH_M)

# Zostawiamy poligony osobno (bez union_all), aby włączyć szybki R-Tree Index!
print("Przetwarzanie geometrii (bez union_all dla lepszej wydajności)...")
green_geoms = list(polys.geometry) + list(river_polys)
green_gdf = gpd.GeoDataFrame(geometry=green_geoms, crs=CRS)
green_gdf["geometry"] = green_gdf.geometry.make_valid()

# --- 3. Bufory wokół odcinków i przecięcie z zielenią -----------------------
print("Wyliczanie buforów...")
buf = edges[["eid", "geometry"]].copy()
buf["geometry"] = buf.geometry.buffer(BUFFER_M)
buf["buf_area"] = buf.geometry.area

inter = gpd.overlay(buf, green_gdf, how="intersection", keep_geom_type=True)
inter["green_area"] = inter.geometry.area
green_area = inter.groupby("eid")["green_area"].sum()

# --- 4. Wynik 0-1 dla każdego odcinka ---------------------------------------
print("Obliczanie score'ów...")
buf = buf.set_index("eid")
buf["green_area"] = green_area
buf["green_area"] = buf["green_area"].fillna(0)
buf["green_score"] = (buf["green_area"] / buf["buf_area"]).clip(0, 1)

edges = edges.set_index("eid")
edges["green_score"] = buf["green_score"]

# --- 5. Zapis dla In-Memory NetworkX i bazy --------------------------------
print("Zapis do plików...")
# Wymagany krok dla Opcji B: Zapisz wynik zieleni do krawędzi oryginalnego grafu (WGS84, nie PL-1992!)
# Musimy iterować po krawędziach po oryginalnych IDków u, v, key
for (u, v, key), row in edges.set_index(["u", "v", "key"]).iterrows():
    if G.has_edge(u, v, key):
        # Convert to string/float to ensure compatibility with graphml format
        G[u][v][key]['green_score'] = str(row['green_score'])

# Make sure data folder exists
os.makedirs("../data", exist_ok=True)
os.makedirs("../data/exports", exist_ok=True)

# 1. Zapis NetworkX GraphML (DO ROUTINGU W FASTAPI)
graphml_path = "../data/krakow_green.graphml"
ox.save_graphml(G, graphml_path)
print(f"✅ Zapisano graf sieciowy do: {graphml_path}")

# 2. Zapisz oryginalnego Geopackage (do podglądu w QGIS)
gpkg_path = "../data/exports/krakow_edges_green.gpkg"
edges.to_crs("EPSG:4326").to_file(gpkg_path, driver="GPKG")
print(f"✅ Zapisano plik wektorowy do: {gpkg_path}")

print("Zakończono! Odpal teraz backend FastAPI.")
