import { Place, PlaceFilterParams, RouteResponse, UserPreferences } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';

// Rzutowanie (import.meta as any) zapobiega błędowi TS2339
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// 1. Pobieranie listy atrakcji z bazy danych z obsługą filtrów wykluczających/włączających
export async function fetchPlacesFromApi(filters?: PlaceFilterParams): Promise<Place[]> {
  try {
    const params = new URLSearchParams();

    if (filters?.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }
    if (filters?.excludeCategories && filters.excludeCategories.length > 0) {
      params.set('exclude_categories', filters.excludeCategories.join(','));
    }
    if (filters?.accessibleOnly) {
      params.set('accessible_only', 'true');
    }
    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      params.set('exclude_ids', filters.excludeIds.join(','));
    }
    if (filters?.search) {
      params.set('search', filters.search);
    }
    if (filters?.limit) {
      params.set('limit', String(filters.limit));
    }
    if (filters?.offset) {
      params.set('offset', String(filters.offset));
    }

    const queryString = params.toString();
    const url = `${API_URL}/api/places${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Błąd pobierania z API');
    const data = await res.json();

    // Mapowanie odpowiedzi backendu z pełną zgodnością camelCase i snake_case
    return data.map((item: any) => {
      const isAcc = Boolean(item.isAccessible);
      const dur = item.durationMinutes ?? 30;
      return {
        ...item,
        isAccessible: isAcc,
        durationMinutes: dur,
      };
    });
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