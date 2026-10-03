import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Trash2 } from 'lucide-react';
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
}

interface FitMapProps {
  route: MapRouteData['route'];
  places: Place[];
}

const CATEGORY_COLORS: Record<Place['category'], string> = {
  culture: '#8b5cf6',
  nature: '#10b981',
  food: '#f97316',
  history: '#eab308',
  viewpoint: '#0ea5e9',
};

const CATEGORY_LABELS: Record<Place['category'], string> = {
  culture: 'Kultura',
  nature: 'Natura',
  food: 'Jedzenie',
  history: 'Historia',
  viewpoint: 'Punkt widokowy',
};

function featureCollection(features: RouteSegment[]): MapRouteData['route'] {
  return { type: 'FeatureCollection', features };
}

function FitMapToData({ route, places }: FitMapProps) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = [
      ...route.features.flatMap((feature) =>
        feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngTuple),
      ),
      ...places.map(({ latitude, longitude }) => [latitude, longitude] as L.LatLngTuple),
    ];

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
  const color = CATEGORY_COLORS[place.category];

  return L.divIcon({
    className: 'poi-marker-wrapper',
    html: `<span class="poi-marker" style="--marker-color:${color}" aria-hidden="true"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 35],
    popupAnchor: [0, -31],
  });
}

export function InteractiveMap({ data, places, onRemovePlace }: InteractiveMapProps) {
  const greenSegments = useMemo(
    () => featureCollection(data.route.features.filter((feature) => feature.properties.green >= 0.5)),
    [data.route.features],
  );
  const litSegments = useMemo(
    () => featureCollection(data.route.features.filter((feature) => feature.properties.lit)),
    [data.route.features],
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
            {places.map((place) => (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={poiIcon(place)}
              >
                <Popup>
                  <article className="poi-popup">
                    <span className="poi-popup__category">{CATEGORY_LABELS[place.category]}</span>
                    <h3>{place.name}</h3>
                    <p>{place.description}</p>
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
            ))}
          </FeatureGroup>
        </LayersControl.Overlay>
      </LayersControl>

      <FitMapToData route={data.route} places={places} />
    </MapContainer>
  );
}
