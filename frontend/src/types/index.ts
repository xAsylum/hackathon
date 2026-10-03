export type Category =
  | 'culture'
  | 'nature'
  | 'food'
  | 'history'
  | 'viewpoint'
  | 'nightlife'
  | 'entertainment'
  | 'landmarks';

export type Mood = 'chill' | 'culture' | 'night_vibe' | 'quick_walk';

export interface Place {
  id: string | number;
  name: string;
  category: Category;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  is_accessible?: boolean;
  durationMinutes?: number;
  duration_minutes?: number;
  description?: string;
  monument_type?: string;
  monument_subtype?: string;
  wheelchair?: string;
  raw_category?: string;
  isCommunitySubmitted?: boolean;
  verification_votes?: number;
  status?: string;
}

export interface PlaceFilterParams {
  categories?: Category[];
  excludeCategories?: Category[];
  accessibleOnly?: boolean;
  excludeIds?: (string | number)[];
  search?: string;
  limit?: number;
  offset?: number;
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
  geojson: any; // GeoJSON object representing the route line
}