import React, { useMemo } from 'react';
import { useAppStore } from '../store/UseAppStore.ts';
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
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Sugerowane atrakcje</span>
        <span>{filteredPlaces.length} miejsc</span>
      </div>

      {filteredPlaces.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 space-y-2">
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