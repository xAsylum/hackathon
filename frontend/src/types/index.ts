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
  description?: string;
  durationMinutes?: number;
  latitude: number;
  longitude: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isWellLit?: boolean;
  isAccessible?: boolean;
  wheelchair?: string;
  monument_type?: string;
  monument_subtype?: string;
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
  green?: number;
  traffic?: number;
  lit?: boolean;
  highway?: string;
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
  geojson?: any;
}

export const CATEGORY_LABELS_PL: Record<string, string> = {
  landmarks: 'Zabytki & Widoki',
  culture: 'Kultura & Sztuka',
  nature: 'Parki & Zieleń',
  'food and cuisine': 'Gastronomia',
  entertainment: 'Rozrywka',
  alcohol: 'Bary & Puby',
};

export function getCategoryLabelPL(category?: string): string {
  if (!category) return 'Inne';
  return CATEGORY_LABELS_PL[category.toLowerCase()] || category;
}