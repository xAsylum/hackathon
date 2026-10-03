export type Category = 'culture' | 'nature' | 'food' | 'history' | 'viewpoint';
export type Mood = 'chill' | 'culture' | 'night_vibe' | 'quick_walk';

export interface Place {
  id: string;
  name: string;
  category: Category;
  description: string;
  durationMinutes: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  isWellLit: boolean;          // kluczowe pod nocne trasy
  isAccessible: boolean;       // bez barier / wózki
  imageUrl?: string;
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

export interface RouteResponse {
  stats: {
    distance_m: number;
    total_min: number;
    pct_green: number;
  };
  route: {
    type: 'FeatureCollection';
    features: RouteSegment[];
  };
}