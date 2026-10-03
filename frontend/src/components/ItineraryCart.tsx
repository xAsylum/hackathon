import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  AlertTriangle,
  Route
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';

export const ItineraryCart: React.FC = () => {
  const { cart, removeFromCart, moveCartItem, preferences, clearCart } = useAppStore();

  // Obliczenie łącznego czasu (czas w atrakcjach + orientacyjny bufor 15 min marszu między punktami)
  const totalAttractionMinutes = cart.reduce(
    (sum, item) => sum + (item.duration_minutes ?? 30),
    0
  );
  const estimatedWalkingMinutes = cart.length > 1 ? (cart.length - 1) * 15 : 0;
  const totalEstimatedMinutes = totalAttractionMinutes + estimatedWalkingMinutes;

  const isOverTimeLimit = totalEstimatedMinutes > preferences.availableTimeMinutes;

  if (cart.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
        <Route className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
        <p className="text-xs font-medium text-slate-300">Twój koszyk trasy jest pusty</p>
        <p className="text-[11px] text-slate-500">
          Wybierz atrakcje z listy lub kliknij punkty na mapie, aby zaplanować kolejność zwiedzania.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podsumowanie czasu i wskaźnik budżetu czasowego */}
      <div className={`p-3.5 rounded-xl border transition-colors ${
        isOverTimeLimit 
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className={`w-3.5 h-3.5 ${isOverTimeLimit ? 'text-rose-400' : 'text-emerald-400'}`} />
            Szacowany czas wycieczki
          </span>
          <span className="font-bold text-sm">
            ~{totalEstimatedMinutes} min ({Math.round((totalEstimatedMinutes / 60) * 10) / 10}h)
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span>Limit czasu: {preferences.availableTimeMinutes} min</span>
          <span>Przystanków: {cart.length}</span>
        </div>

        {isOverTimeLimit && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-400 mt-2 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Trasa przekracza Twój zadeklarowany budżet czasowy.</span>
          </div>
        )}
      </div>

      {/* Lista uporządkowanych punktów */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Kolejność zwiedzania</span>
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
          >
            Wyczyść wszystko
          </button>
        </div>

        {cart.map((place, index) => {
          const isFirst = index === 0;
          const isLast = index === cart.length - 1;

          return (
            <div
              key={place.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              {/* Numer przystanku */}
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>

              {/* Informacje o punkcie */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                  {place.name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span className="capitalize">{place.category}</span>
                  <span>•</span>
                  <span>{place.duration_minutes ?? 30} min zwiedzania</span>
                </div>
              </div>

              {/* Przyciski zmiany kolejności (▲ / ▼) oraz usuwanie */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => moveCartItem(index, 'up')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Przesuń wyżej"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => moveCartItem(index, 'down')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Przesuń niżej"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFromCart(place.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  title="Usuń z planu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};