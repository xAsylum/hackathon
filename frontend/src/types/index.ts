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