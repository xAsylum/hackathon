import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { PlaceCard } from './PlaceCard.tsx';
import { Compass, Search, X, Loader2, ChevronDown, Filter, Accessibility } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  activeQuery: string;
}

// Wyizolowany komponent wyszukiwarki:
// Pisanie aktualizuje tylko lokalny stan pola, gwarantując 0 ms opóźnienia i brak lagów.
const SearchBar: React.FC<SearchBarProps> = React.memo(({ onSearch, isLoading, activeQuery }) => {
  const [value, setValue] = useState(activeQuery);

  useEffect(() => {
    setValue(activeQuery);
  }, [activeQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Szukaj atrakcji (np. Wawel, Sukiennice, park)..."
          className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            title="Wyczyść tekst"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition-all shadow-sm flex-shrink-0 cursor-pointer active:scale-95"
        title="Szukaj (Enter)"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
        <span>Szukaj</span>
      </button>
    </form>
  );
});

SearchBar.displayName = 'SearchBar';

export const PlacesList: React.FC = () => {
  const { allPlaces, preferences, searchQuery, setSearchQuery, isLoading } = useAppStore();
  const [visibleCount, setVisibleCount] = useState(30);

  // Zatwierdzenie wyszukiwania przez Enter lub przycisk
  const handleSearch = useCallback(
    (query: string) => {
      setVisibleCount(30);
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  const handleResetSearch = useCallback(() => {
    handleSearch('');
  }, [handleSearch]);

  // Filtrowanie z zachowaniem nałożonych filtrów kategorii, dostępności i wyszukiwania
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      // 1. Filtr kategorii
      if (
        preferences.selectedCategories.length > 0 &&
        !preferences.selectedCategories.includes(place.category)
      ) {
        return false;
      }

      // 2. Dostępność dla wózków
      if (preferences.accessibleOnly && !place.isAccessible) {
        return false;
      }

      // 3. Spójność wyszukiwania
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = place.name.toLowerCase().includes(q);
        const matchesDesc = (place.description || '').toLowerCase().includes(q);
        const matchesCategory = place.category.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [allPlaces, preferences, searchQuery]);

  // Podgląd porcjami (dla płynności DOM)
  const visiblePlaces = useMemo(() => {
    return filteredPlaces.slice(0, visibleCount);
  }, [filteredPlaces, visibleCount]);

  const activeFiltersCount =
    preferences.selectedCategories.length + (preferences.accessibleOnly ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Pasek wyszukiwania */}
      <SearchBar
        onSearch={handleSearch}
        isLoading={isLoading}
        activeQuery={searchQuery}
      />

      {/* Belka informacyjna o aktywnych filtrach i wynikach */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Atrakcje</span>

          {searchQuery && (
            <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-emerald-400 border border-slate-700/60 flex items-center gap-1">
              Szukane: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={handleResetSearch}
                className="hover:text-emerald-200 cursor-pointer ml-0.5"
                title="Usuń frazę wyszukiwania"
              >
                ×
              </button>
            </span>
          )}

          {activeFiltersCount > 0 && (
            <span className="bg-slate-800/80 px-2 py-0.5 rounded-full text-[10px] text-sky-400 border border-slate-700/50 flex items-center gap-1">
              <Filter className="w-2.5 h-2.5" />
              {preferences.selectedCategories.length > 0 &&
                `${preferences.selectedCategories.length} kat.`}
              {preferences.accessibleOnly && (
                <span className="flex items-center gap-0.5 ml-1">
                  <Accessibility className="w-2.5 h-2.5" /> wózki
                </span>
              )}
            </span>
          )}
        </div>

        <span className="text-slate-400">
          {visiblePlaces.length < filteredPlaces.length
            ? `${visiblePlaces.length} z ${filteredPlaces.length} miejsc`
            : `${filteredPlaces.length} miejsc`}
        </span>
      </div>

      {/* Lista wyników lub informacja o braku dopasowań */}
      {filteredPlaces.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 space-y-2">
          <Compass className="w-8 h-8 mx-auto stroke-1 text-slate-600" />
          <p className="text-xs">
            {searchQuery
              ? `Brak atrakcji pasujących do frazy "${searchQuery}" przy aktualnie zaznaczonych filtrach.`
              : 'Brak miejsc spełniających wszystkie wybrane filtry.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer"
            >
              Wyczyść filtr wyszukiwania
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {visiblePlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}

          {visibleCount < filteredPlaces.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 30)}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>
                Pokaż więcej atrakcji (+
                {Math.min(30, filteredPlaces.length - visibleCount)})
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};