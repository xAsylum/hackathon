import { create } from 'zustand';
import { Place, UserPreferences, RouteResponse } from '../types';
import { fetchPlacesFromApi, calculateRouteApi } from '../api/places';

interface AppState {
  allPlaces: Place[];
  preferences: UserPreferences;
  cart: Place[];
  isRouteGenerated: boolean;
  isLoading: boolean;
  routeData: RouteResponse | null;

  // Akcje
  loadPlaces: (filters?: import('../types').PlaceFilterParams) => Promise<void>;
  generateRoute: () => Promise<void>;
  setIsRouteGenerated: (value: boolean) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  addToCart: (place: Place) => void;
  removeFromCart: (placeId: string | number) => void;
  moveCartItem: (index: number, direction: 'up' | 'down') => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  allPlaces: [],
  preferences: {
    mood: 'chill',
    availableTimeMinutes: 120,
    prioritizeWellLit: true,
    accessibleOnly: false,
    selectedCategories: ['culture', 'nature'],
  },
  cart: [],
  isRouteGenerated: false,
  isLoading: false,
  routeData: null,

  loadPlaces: async (filters) => {
    set({ isLoading: true });
    const places = await fetchPlacesFromApi(filters);
    set({ allPlaces: places, isLoading: false });
  },

  generateRoute: async () => {
    const { cart, preferences } = get();
    if (cart.length === 0) return;

    set({ isLoading: true });
    const result = await calculateRouteApi(cart, preferences);
    set({
      routeData: result,
      isRouteGenerated: true,
      isLoading: false
    });
  },

  setIsRouteGenerated: (value) => set({ isRouteGenerated: value }),

  setPreferences: (newPrefs) =>
    set((state) => ({ preferences: { ...state.preferences, ...newPrefs } })),

  addToCart: (place) =>
    set((state) => {
      if (state.cart.some((item) => String(item.id) === String(place.id))) return state;
      return { cart: [...state.cart, place] };
    }),

  removeFromCart: (placeId) =>
    set((state) => ({
      cart: state.cart.filter((item) => String(item.id) !== String(placeId)),
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