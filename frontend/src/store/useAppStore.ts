import { create } from 'zustand';
import { Place, UserPreferences, RouteResponse, PlaceFilterParams } from '../types';
import {
  fetchPlacesFromApi,
  calculateRouteApi,
  setAttractionLike,
} from '../api/places';

let activeRouteRequestId = 0;

const sortByLikes = (places: Place[]): Place[] =>
  [...places].sort(
    (a, b) =>
      b.likesCount - a.likesCount ||
      a.name.localeCompare(b.name, 'pl'),
  );

interface AppState {
  allPlaces: Place[];
  preferences: UserPreferences;
  searchQuery: string;
  cart: Place[];
  cartWasModified: boolean;
  isRouteGenerated: boolean;
  isLoading: boolean;
  pendingLikeIds: string[];
  routeData: RouteResponse | null;

  // Akcje
  setSearchQuery: (query: string) => void;
  loadPlaces: (filters?: PlaceFilterParams) => Promise<void>;
  generateRoute: () => Promise<void>;
  recalculateRoute: () => Promise<void>;
  setIsRouteGenerated: (value: boolean) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  addToCart: (place: Place) => void;
  removeFromCart: (placeId: string | number) => void;
  toggleLike: (placeId: string | number) => Promise<void>;
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
  cartWasModified: false,
  isRouteGenerated: false,
  isLoading: false,
  pendingLikeIds: [],
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
    set({ allPlaces: sortByLikes(places), isLoading: false });
  },

  generateRoute: async () => {
    set({ isRouteGenerated: true });
    await get().recalculateRoute();
  },

  recalculateRoute: async () => {
    const { cart, preferences } = get();
    if (cart.length < 2) {
      set({
        routeData: {
          distance_meters: 0,
          duration_seconds: 0,
          stats: { distance_m: 0, total_min: 0, pct_green: 0 },
          geojson: { type: 'FeatureCollection', features: [] },
        },
        isLoading: false,
      });
      return;
    }

    const currentRequestId = ++activeRouteRequestId;
    set({ isLoading: true });

    try {
      const result = await calculateRouteApi(cart, preferences);
      if (currentRequestId === activeRouteRequestId) {
        set({
          routeData: result,
          isLoading: false,
          cartWasModified: false,
        });
      }
    } catch (err) {
      if (currentRequestId === activeRouteRequestId) {
        console.error('Błąd przeliczania trasy:', err);
        set({ isLoading: false });
      }
    }
  },

  setIsRouteGenerated: (value) => set({ isRouteGenerated: value }),

  // Aktualizacja preferencji automatycznie odświeża listę i przelicza wygenerowaną trasę
  setPreferences: (newPrefs) => {
    set((state) => ({ preferences: { ...state.preferences, ...newPrefs } }));
    get().loadPlaces();

    const state = get();
    if (
      (state.isRouteGenerated || Boolean(state.routeData)) &&
      state.cart.length >= 2 &&
      (newPrefs.mood !== undefined ||
        newPrefs.prioritizeWellLit !== undefined ||
        newPrefs.accessibleOnly !== undefined)
    ) {
      get().recalculateRoute();
    }
  },

  // Dodanie do koszyka automatycznie przelicza trasę, jeśli widok trasy jest aktywny
  addToCart: (place) => {
    const state = get();
    if (state.cart.some((item) => String(item.id) === String(place.id))) return;
    const newCart = [...state.cart, place];
    set({ cart: newCart, cartWasModified: true });
    if (state.isRouteGenerated || Boolean(state.routeData)) {
      get().recalculateRoute();
    }
  },

  // Usunięcie punktu automatycznie przelicza trasę
  removeFromCart: (placeId) => {
    const state = get();
    const newCart = state.cart.filter((item) => String(item.id) !== String(placeId));
    set({ cart: newCart, cartWasModified: true });
    if (newCart.length < 2) {
      set({
        routeData: {
          distance_meters: 0,
          duration_seconds: 0,
          stats: { distance_m: 0, total_min: 0, pct_green: 0 },
          geojson: { type: 'FeatureCollection', features: [] },
        },
      });
    } else if (state.isRouteGenerated || Boolean(state.routeData)) {
      get().recalculateRoute();
    }
  },

  toggleLike: async (placeId) => {
    const key = String(placeId);
    const state = get();
    if (state.pendingLikeIds.includes(key)) return;

    const place = state.allPlaces.find((item) => String(item.id) === key);
    if (!place) return;

    const previousLiked = place.isLiked;
    const previousCount = place.likesCount;
    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));
    const updatePlace = (
      item: Place,
      isLiked: boolean,
      likesCount: number,
    ): Place =>
      String(item.id) === key ? { ...item, isLiked, likesCount } : item;

    set((current) => ({
      allPlaces: sortByLikes(
        current.allPlaces.map((item) =>
          updatePlace(item, nextLiked, nextCount),
        ),
      ),
      cart: current.cart.map((item) =>
        updatePlace(item, nextLiked, nextCount),
      ),
      pendingLikeIds: [...current.pendingLikeIds, key],
    }));

    try {
      const result = await setAttractionLike(placeId, nextLiked);
      set((current) => ({
        allPlaces: sortByLikes(
          current.allPlaces.map((item) =>
            updatePlace(item, result.liked, result.likes_count),
          ),
        ),
        cart: current.cart.map((item) =>
          updatePlace(item, result.liked, result.likes_count),
        ),
        pendingLikeIds: current.pendingLikeIds.filter((id) => id !== key),
      }));
    } catch (error) {
      console.error('Nie udało się zapisać polubienia', error);
      set((current) => ({
        allPlaces: sortByLikes(
          current.allPlaces.map((item) =>
            updatePlace(item, previousLiked, previousCount),
          ),
        ),
        cart: current.cart.map((item) =>
          updatePlace(item, previousLiked, previousCount),
        ),
        pendingLikeIds: current.pendingLikeIds.filter((id) => id !== key),
      }));
    }
  },

  // Zmiana kolejności punktów w trasie natychmiast przelicza nową trasę
  moveCartItem: (index, direction) => {
    const state = get();
    const newCart = [...state.cart];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCart.length) return;
    const [moved] = newCart.splice(index, 1);
    newCart.splice(targetIndex, 0, moved);
    set({ cart: newCart, cartWasModified: true });
    if (state.isRouteGenerated || Boolean(state.routeData)) {
      get().recalculateRoute();
    }
  },

  clearCart: () =>
    set({
      cart: [],
      cartWasModified: true,
      routeData: {
        distance_meters: 0,
        duration_seconds: 0,
        stats: { distance_m: 0, total_min: 0, pct_green: 0 },
        geojson: { type: 'FeatureCollection', features: [] },
      },
    }),
}));