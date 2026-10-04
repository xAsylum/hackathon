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
import { getCategoryLabelPL } from '../types';

export const ItineraryCart: React.FC = () => {
  const { cart, removeFromCart, moveCartItem, preferences, clearCart } = useAppStore();

  // Obliczenie łącznego czasu (czas w atrakcjach + orientacyjny bufor 15 min marszu między punktami)
  const totalAttractionMinutes = cart.reduce(
    (sum, item) => sum + (item.durationMinutes ?? 30),
    0
  );
  const estimatedWalkingMinutes = cart.length > 1 ? (cart.length - 1) * 15 : 0;
  const totalEstimatedMinutes = totalAttractionMinutes + estimatedWalkingMinutes;

  const isOverTimeLimit = totalEstimatedMinutes > preferences.availableTimeMinutes;

  if (cart.length === 0) {
    return (
      <div>
        <Route className="w-8 h-8 mx-auto text-emerald-800 stroke-1" />
        <p className="text-xs font-medium text-emerald-800">Twój koszyk trasy jest pusty</p>
        <p className="text-[11px] text-emerald-800">
          Wybierz atrakcje z listy, aby zaplanować kolejność zwiedzania.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podsumowanie czasu i wskaźnik budżetu czasowego */}
      <div className={`p-3.5 rounded-xl border transition-colors ${
        isOverTimeLimit 
          ? 'text-rose-200' 
          : 'text-slate-200'
      }`}>
        <div className="flex items-center justify-between text-xs mb-1.5 text-emerald-800">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className={`w-3.5 h-3.5 ${isOverTimeLimit ? 'text-rose-400' : 'text-emerald-800'}`} />
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
            <span>Trasa przekracza Twój zadeklarowany limit czasowy.</span>
          </div>
        )}
      </div>

      {/* Lista uporządkowanych punktów */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-emerald-800">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Kolejność zwiedzania</span>
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] text-emerald-800 hover:text-rose-400 transition-colors"
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
              className="flex items-center gap-2.5 p-2.5 rounded-xl  hover:border-slate-700 transition-all group"
            >
              {/* Numer przystanku */}
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>

              {/* Informacje o punkcie */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-left font-semibold text-emerald-800 truncate transition-colors">
                  {place.name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span>{getCategoryLabelPL(place.category)}</span>
                  <span>•</span>
                  <span>{place.durationMinutes ?? 30} min zwiedzania</span>
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