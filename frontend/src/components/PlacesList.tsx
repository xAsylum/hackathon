import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { PlaceCard } from './PlaceCard.tsx';
import { Compass } from 'lucide-react';

export const PlacesList: React.FC = () => {
  const { allPlaces, preferences } = useAppStore();

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      // Filtr kategorii (jeśli jakiekolwiek są zaznaczone)
      if (
        preferences.selectedCategories.length > 0 &&
        !preferences.selectedCategories.includes(place.category)
      ) {
        return false;
      }

      // Wymóg dostępności dla wózków
      if (preferences.accessibleOnly && !place.isAccessible) {
        return false;
      }

      // Wymóg oświetlenia po zmroku
      if (preferences.prioritizeWellLit && !place.isWellLit) {
        return false;
      }

      return true;
    });
  }, [allPlaces, preferences]);

  return (
    <div className="space-y-3 text-center mx-auto mb-10 space-y-2 bg-neutral-200/90 p-2 rounded-xl border border-neutral-200 shadow-md">
      <div className="flex items-center justify-between text-xs text-emerald-800 px-1 bg-neutral-200/90">
        <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">Sugerowane atrakcje</span>
        <span>{filteredPlaces.length} miejsc</span>
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="p-6 text-center rounded-xl text-emerald-800 space-y-2">
          <Compass className="w-8 h-8 mx-auto stroke-1" />
          <p className="text-xs">Brak miejsc spełniających wszystkie wybrane filtry.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
};