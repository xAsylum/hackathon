import { Place, RouteResponse, UserPreferences } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';

// Rzutowanie (import.meta as any) zapobiega błędowi TS2339
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// 1. Pobieranie listy atrakcji z bazy danych
export async function fetchPlacesFromApi(): Promise<Place[]> {
  try {
    const res = await fetch(`${API_URL}/api/places`);
    if (!res.ok) throw new Error('Błąd pobierania z API');
    const data = await res.json();

    // Mapowanie odpowiedzi backendu (snake_case -> camelCase) z wartościami domyślnymi
    return data.map((item: any) => ({
      ...item,
      isAccessible: item.isAccessible ?? item.is_accessible ?? true,
      durationMinutes: item.durationMinutes ?? item.duration_minutes ?? 30,
    }));
  } catch (err) {
    console.warn('Backend niedostępny – używam danych lokalnych (mock)', err);
    return MOCK_PLACES;
  }
}

// 2. Wysłanie wybranego koszyka do silnika trasowania backendu
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

    if (!res.ok) throw new Error('Błąd kalkulacji trasy');
    return await res.json();
  } catch (err) {
    console.warn('Brak połączenia z silnikiem trasowania. Zwracam mock trasy.', err);
    return {
      distance_meters: 2800,
      duration_seconds: 2100, // ~35 min
      geojson: {
        type: 'LineString',
        coordinates: places.map((p) => [p.longitude, p.latitude]),
      },
    };
  }
}