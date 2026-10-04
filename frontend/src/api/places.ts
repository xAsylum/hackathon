
import {
  Place,
  RouteResponse,
  UserPreferences,
  Category,
  PlaceFilterParams,
} from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
const VISITOR_STORAGE_KEY = 'detour-visitor-id';

function getVisitorId(): string {
  const storedId = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (storedId) return storedId;

  const newId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(VISITOR_STORAGE_KEY, newId);
  return newId;
}

export interface AttractionLikeResponse {
  attraction_id: number;
  likes_count: number;
  liked: boolean;
}

// 1. Pobieranie danych z bazy FastAPI
export async function fetchPlacesFromApi(
  filters: PlaceFilterParams = {},
): Promise<Place[]> {
  try {
    const query = new URLSearchParams();
    query.set('limit', String(filters.limit ?? 50));
    if (filters.search) query.set('search', filters.search);
    if (filters.accessibleOnly) query.set('accessible_only', 'true');
    filters.categories?.forEach((category) =>
      query.append('categories', category),
    );
    filters.excludeCategories?.forEach((category) =>
      query.append('exclude_categories', category),
    );
    if (filters.offset) query.set('offset', String(filters.offset));

    const res = await fetch(`${API_URL}/api/attractions?${query}`, {
      headers: {
        'X-Visitor-Id': getVisitorId(),
      },
    });
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
      likesCount: item.likes_count ?? 0,
      isLiked: item.liked ?? false,
    }));
  } catch (err) {
    console.warn('Backend niedostępny – używam MOCK_PLACES', err);
    return MOCK_PLACES;
  }
}

export async function setAttractionLike(
  attractionId: string | number,
  shouldLike: boolean,
): Promise<AttractionLikeResponse> {
  const res = await fetch(`${API_URL}/api/attractions/${attractionId}/like`, {
    method: shouldLike ? 'PUT' : 'DELETE',
    headers: {
      'X-Visitor-Id': getVisitorId(),
    },
  });

  if (!res.ok) {
    throw new Error(`Nie udało się zapisać polubienia: HTTP ${res.status}`);
  }

  return res.json();
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