
import { Place, RouteResponse, UserPreferences, Category } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// 1. Pobieranie danych z bazy FastAPI
export async function fetchPlacesFromApi(): Promise<Place[]> {
  try {
    const res = await fetch(`${API_URL}/api/attractions/random?limit=50`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      category: item.category as Category,
      monument_type: item.monument_type,
      monument_subtype: item.monument_subtype || undefined,
      latitude: item.latitude,
      longitude: item.longitude,
      wheelchair: item.wheelchair,
      isAccessible: item.wheelchair === 'yes' || item.wheelchair === 'designated',
      durationMinutes: item.monument_type === 'museum' ? 60 : 30,
    }));
  } catch (err) {
    console.warn('Backend niedostępny – używam MOCK_PLACES', err);
    return MOCK_PLACES;
  }
}

// 2. Wysłanie trasy do routingu (z fallbackiem dopóki zespół nie dopisze endpointu)
export async function calculateRouteApi(
  places: Place[],
  preferences: UserPreferences
): Promise<RouteResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/route/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waypoints: places.map((p) => ({
          id: p.id,
          lat: p.latitude,
          lng: p.longitude,
        })),
        accessible_only: preferences.accessibleOnly,
        prioritize_lit: preferences.prioritizeWellLit,
        mood: preferences.mood,
      }),
    });

    if (!res.ok) throw new Error('Brak endpointu trasy w backendzie');
    return await res.json();
  } catch (err) {
    console.warn('Używam mocka trasy', err);
    return {
      distance_meters: 2800,
      duration_seconds: 2100,
      geojson: {
        type: 'LineString',
        coordinates: places.map((p) => [p.longitude, p.latitude]),
      },
    };
  }
}