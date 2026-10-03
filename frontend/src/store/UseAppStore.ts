import { create } from 'zustand';
import { Place, UserPreferences } from '../types';
import { MOCK_PLACES } from '../data/mockPlaces';

interface AppState {
  allPlaces: Place[];
  preferences: UserPreferences;
  cart: Place[];
  // Nowe: kontrola widoku
  isRouteGenerated: boolean;
  setIsRouteGenerated: (value: boolean) => void;

  setPreferences: (prefs: Partial<UserPreferences>) => void;
  addToCart: (place: Place) => void;
  removeFromCart: (placeId: string) => void;
  moveCartItem: (index: number, direction: 'up' | 'down') => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  allPlaces: MOCK_PLACES,
  preferences: {
    mood: 'chill',
    availableTimeMinutes: 120,
    prioritizeWellLit: true,
    accessibleOnly: false,
    selectedCategories: ['culture', 'nature'],
  },
  cart: [],
  isRouteGenerated: false, // Domyślnie startujemy od pełnego ekranu konfiguracyjnego

  setIsRouteGenerated: (value) => set({ isRouteGenerated: value }),

  setPreferences: (newPrefs) =>
    set((state) => ({ preferences: { ...state.preferences, ...newPrefs } })),

  addToCart: (place) =>
    set((state) => {
      if (state.cart.some((item) => item.id === place.id)) return state;
      return { cart: [...state.cart, place] };
    }),

  removeFromCart: (placeId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== placeId),
    })),

  moveCartItem: (index, direction) =>
    set((state) => {
      const newCart = [...state.cart];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newCart.length) return state;
      const [moved] = newCart.splice(index, 1);
      newCart.splice(targetIndex, 0, moved);
      return { cart: newCart };
    }),

  clearCart: () => set({ cart: [] }),
}));