import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Heart, Trash2 } from 'lucide-react';
import {
  FeatureGroup,
  GeoJSON,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { MapRouteData, Place, RouteSegment } from '../types';

interface InteractiveMapProps {
  data: MapRouteData;
  places: Place[];
  onRemovePlace?: (placeId: string | number) => void;
  onToggleLike?: (placeId: string | number) => void;
}

interface FitMapProps {
  route: MapRouteData['route'];
  places: Place[];
}

const CATEGORY_COLORS: Record<string, string> = {
  landmarks: '#eab308',
  history: '#eab308',
  viewpoint: '#0ea5e9',
  culture: '#8b5cf6',
  nature: '#10b981',
  'food and cuisine': '#f97316',
  food: '#f97316',
  entertainment: '#0ea5e9',
  alcohol: '#ec4899',
  nightlife: '#ec4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  landmarks: 'Zabytek',
  history: 'Historia',
  viewpoint: 'Punkt widokowy',
  culture: 'Kultura',
  nature: 'Natura',
  'food and cuisine': 'Jedzenie',
  food: 'Jedzenie',
  entertainment: 'Rozrywka',
  alcohol: 'Bar lub pub',
  nightlife: 'Bar lub pub',
};

// Bezpieczny odczyt współrzędnych niezależnie od formatu (FastAPI vs Mock)
function getPlaceCoords(place: Place): L.LatLngTuple | null {
  const lat = place.latitude ?? place.coordinates?.lat;
  const lng = place.longitude ?? place.coordinates?.lng;

  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return [lat, lng];
  }
  return null;
}

function featureCollection(features: RouteSegment[]): MapRouteData['route'] {
  return { type: 'FeatureCollection', features };
}

function FitMapToData({ route, places }: FitMapProps) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = [];

    // Pobieranie współrzędnych ze ścieżki GeoJSON
    route?.features?.forEach((feature) => {
      feature.geometry?.coordinates?.forEach(([lng, lat]) => {
        if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
          points.push([lat, lng]);
        }
      });
    });

    // Pobieranie współrzędnych z punktów POI
    places.forEach((place) => {
      const coords = getPlaceCoords(place);
      if (coords) {
        points.push(coords);
      }
    });

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [48, 48],
        maxZoom: 16,
      });
    }
  }, [map, places, route]);

  return null;
}

function poiIcon(place: Place) {
  const color = CATEGORY_COLORS[place.category] ?? '#64748b';

  return L.divIcon({
    className: 'poi-marker-wrapper',
    html: `<span class="poi-marker" style="--marker-color:${color}" aria-hidden="true"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 35],
    popupAnchor: [0, -31],
  });
}

export function InteractiveMap({
  data,
  places,
  onRemovePlace,
  onToggleLike,
}: InteractiveMapProps) {
  const greenSegments = useMemo(
    () =>
      featureCollection(
        data?.route?.features?.filter((feature) => (feature.properties?.green ?? 0) >= 0.5) ?? [],
      ),
    [data?.route?.features],
  );

  const litSegments = useMemo(
    () =>
      featureCollection(
        data?.route?.features?.filter((feature) => Boolean(feature.properties?.lit)) ?? [],
      ),
    [data?.route?.features],
  );

  // Wymuszenie odświeżenia warstwy GeoJSON w Leaflet po przeliczeniu trasy
  const routeKey = useMemo(
    () => `${data?.route?.features?.length ?? 0}-${JSON.stringify(data?.stats ?? {})}`,
    [data],
  );

  return (
    <MapContainer
      center={[50.0619, 19.9373]}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LayersControl position="topright" collapsed={false}>
        <LayersControl.Overlay checked name="Przebieg trasy">
          <GeoJSON
            key={`route-${routeKey}`}
            data={data.route}
            style={{
              color: '#334155',
              weight: 9,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Tereny zielone">
          <GeoJSON
            key={`green-${routeKey}`}
            data={greenSegments}
            style={{
              color: '#10b981',
              weight: 5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Oświetlenie nocne">
          <GeoJSON
            key={`lit-${routeKey}`}
            data={litSegments}
            style={{
              color: '#fbbf24',
              weight: 5,
              opacity: 1,
              dashArray: '9 7',
              lineCap: 'round',
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Punkty POI">
          <FeatureGroup>
            {places.map((place) => {
              const coords = getPlaceCoords(place);
              if (!coords) return null;

              return (
                <Marker
                  key={place.id}
                  position={coords}
                  icon={poiIcon(place)}
                >
                  <Popup>
                    <article className="poi-popup">
                      <span className="poi-popup__category">
                        {CATEGORY_LABELS[place.category] || place.category}
                      </span>
                      <h3>{place.name}</h3>
                      {place.description && <p>{place.description}</p>}
                      <dl>
                        <div>
                          <dt>Czas</dt>
                          <dd>{place.durationMinutes ?? 30} min</dd>
                        </div>
                        <div>
                          <dt>Oświetlenie</dt>
                          <dd>{place.isWellLit == null ? 'Brak danych' : place.isWellLit ? 'Tak' : 'Nie'}</dd>
                        </div>
                        <div>
                          <dt>Bez barier</dt>
                          <dd>{place.isAccessible ? 'Tak' : 'Nie'}</dd>
                        </div>
                      </dl>
                      {onToggleLike && (
                        <button
                          type="button"
                          className={`poi-popup__like ${place.isLiked ? 'is-liked' : ''}`}
                          onClick={() => onToggleLike(place.id)}
                          aria-pressed={place.isLiked}
                        >
                          <Heart
                            size={14}
                            fill={place.isLiked ? 'currentColor' : 'none'}
                            aria-hidden="true"
                          />
                          {place.isLiked ? 'Warto odwiedzić' : 'Poleć atrakcję'}
                          <span>{place.likesCount}</span>
                        </button>
                      )}
                      {onRemovePlace && (
                        <button
                          type="button"
                          className="poi-popup__remove"
                          onClick={() => onRemovePlace(place.id)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Usuń z trasy
                        </button>
                      )}
                    </article>
                  </Popup>
                </Marker>
              );
            })}
          </FeatureGroup>
        </LayersControl.Overlay>
      </LayersControl>

      <FitMapToData route={data.route} places={places} />
    </MapContainer>
  );
}