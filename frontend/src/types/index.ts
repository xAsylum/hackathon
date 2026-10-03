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
  durationMinutes?: number;
  monument_type?: string;
  monument_subtype?: string;
}

export interface UserPreferences {
  mood: Mood;
  availableTimeMinutes: number;
  prioritizeWellLit: boolean;
  accessibleOnly: boolean;
  selectedCategories: Category[];
}

export interface RouteSegmentProperties {
  green: number;
  traffic: number;
  lit: boolean;
  highway: string;
}

export interface RouteSegment {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: RouteSegmentProperties;
}

export interface RouteFeatureCollection {
  type: 'FeatureCollection';
  features: RouteSegment[];
}

export interface MapRouteData {
  stats: {
    distance_m: number;
    total_min: number;
    pct_green: number;
  };
  route: RouteFeatureCollection;
}

export interface RouteResponse {
  distance_meters: number;
  duration_seconds: number;
  geojson:
    | RouteFeatureCollection
    | {
        type: 'LineString';
        coordinates: [number, number][];
      };
}