export type Category =
  | 'history'
  | 'viewpoint'
  | 'culture'
  | 'nature'
  | 'food'
  | 'entertainment'
  | 'nightlife';

export type Mood = 'chill' | 'culture' | 'night_vibe' | 'quick_walk';

export interface Place {
  id: string | number;
  name: string;
  category: Category;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  description?: string;
  durationMinutes?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isWellLit?: boolean;
  wheelchair?: string;
  monument_type?: string;
  monument_subtype?: string;
  likesCount: number;
  isLiked: boolean;
  imageUrl?: string;
}

export interface UserPreferences {
  mood: Mood;
  availableTimeMinutes: number;
  prioritizeWellLit: boolean;
  accessibleOnly: boolean;
  selectedCategories: Category[];
}

export interface PlaceFilterParams {
  search?: string;
  accessibleOnly?: boolean;
  categories?: Category[];
  excludeCategories?: Category[];
  limit?: number;
  offset?: number;
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
  stats?: {
    distance_m: number;
    total_min: number;
    pct_green: number;
  };
  geojson:
    | RouteFeatureCollection
    | {
        type: 'LineString';
        coordinates: [number, number][];
      };
  route?: RouteFeatureCollection;
}

export const CATEGORY_LABELS_PL: Record<string, string> = {
  history: 'Zabytki',
  viewpoint: 'Widoki',
  culture: 'Kultura & Sztuka',
  nature: 'Parki & Zieleń',
  food: 'Gastronomia',
  entertainment: 'Rozrywka',
  nightlife: 'Bary & Puby',
};

export function getCategoryLabelPL(category?: string): string {
  if (!category) return 'Inne';
  return CATEGORY_LABELS_PL[category.toLowerCase()] || category;
}