import { create } from 'zustand';
import { Place, UserPreferences, RouteResponse, PlaceFilterParams } from '../types';
import { fetchPlacesFromApi, calculateRouteApi } from '../api/places';

interface AppState {
  allPlaces: Place[];
  preferences: UserPreferences;
  searchQuery: string;
  cart: Place[];
  isRouteGenerated: boolean;
  isLoading: boolean;
  routeData: RouteResponse | null;

  // Akcje
  setSearchQuery: (query: string) => void;
  loadPlaces: (filters?: PlaceFilterParams) => Promise<void>;
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
  searchQuery: '',
  cart: [],
  isRouteGenerated: false,
  isLoading: false,
  routeData: null,

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().loadPlaces({ search: query.trim() || undefined });
  },

  // Pobieranie miejsc zawsze łączące aktywne wyszukiwanie z nałożonymi filtrami
  loadPlaces: async (overrideFilters) => {
    const { preferences, searchQuery } = get();

    const effectiveSearch =
      overrideFilters?.search !== undefined
        ? overrideFilters.search
        : searchQuery.trim() || undefined;

    const effectiveAccessibleOnly =
      overrideFilters?.accessibleOnly !== undefined
        ? overrideFilters.accessibleOnly
        : preferences.accessibleOnly || undefined;

    const effectiveCategories =
      overrideFilters?.categories !== undefined
        ? overrideFilters.categories
        : preferences.selectedCategories.length > 0
        ? preferences.selectedCategories
        : undefined;

    const effectiveFilters: PlaceFilterParams = {
      search: effectiveSearch,
      accessibleOnly: effectiveAccessibleOnly,
      categories: effectiveCategories,
      ...overrideFilters,
    };

    set({ isLoading: true });
    const places = await fetchPlacesFromApi(effectiveFilters);
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
      isLoading: false,
    });
  },

  setIsRouteGenerated: (value) => set({ isRouteGenerated: value }),

  // Aktualizacja preferencji automatycznie odświeża listę z zachowaniem wyszukiwania
  setPreferences: (newPrefs) => {
    set((state) => ({ preferences: { ...state.preferences, ...newPrefs } }));
    get().loadPlaces();
  },

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