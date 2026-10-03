export type Category = 'culture' | 'nature' | 'food' | 'history' | 'viewpoint';
export type Mood = 'chill' | 'culture' | 'night_vibe' | 'quick_walk';

export interface Place {
  id: string | number;
  name: string;
  category: Category;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  isCommunitySubmitted?: boolean;
  verification_votes?: number;
  status?: string;
  // Pola opcjonalne z domyślnym fallbackiem w UI
  description?: string;
  durationMinutes?: number;
}

export interface UserPreferences {
  mood: Mood;
  availableTimeMinutes: number;
  prioritizeWellLit: boolean;
  accessibleOnly: boolean;
  selectedCategories: Category[];
}

export interface RouteResponse {
  distance_meters: number;
  duration_seconds: number;
  geojson: any; // obiekt GeoJSON (linia trasy do narysowania na mapie)
}