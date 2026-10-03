export type Category =
  | 'landmarks'
  | 'culture'
  | 'nature'
  | 'food and cuisine'
  | 'entertainment'
  | 'alcohol';

export type Mood = 'chill' | 'culture' | 'night_vibe' | 'quick_walk';

export interface Place {
  id: string | number;
  name: string;
  category: Category;
  monument_type: string;
  monument_subtype?: string;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  wheelchair?: string;
  description?: string;
  durationMinutes: number;
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
  geojson: any;
}