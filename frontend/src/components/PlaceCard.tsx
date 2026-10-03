import React from 'react';
import { Plus, Check, Clock, Shield, Accessibility } from 'lucide-react';
import { Place } from '../types';
import { useAppStore } from '../store/UseAppStore.ts';

interface PlaceCardProps {
  place: Place;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const { cart, addToCart, removeFromCart } = useAppStore();
  const isInCart = cart.some((item) => item.id === place.id);

  return (
    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-100 text-sm leading-tight group-hover:text-emerald-300 transition-colors">
            {place.name}
          </h4>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
            {place.category}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {place.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        {/* Metadane Smart City */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-500" />
            {place.durationMinutes} min
          </span>
          {place.isWellLit && (
            <span title="Dobre oświetlenie nocne" className="flex items-center">
              <Shield className="w-3 h-3 text-amber-400" />
            </span>
          )}
          {place.isAccessible && (
            <span title="Dostępne dla wózków" className="flex items-center">
              <Accessibility className="w-3 h-3 text-sky-400" />
            </span>
          )}
        </div>

        {/* Przycisk akcji */}
        <button
          type="button"
          onClick={() => (isInCart ? removeFromCart(place.id) : addToCart(place))}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isInCart
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-3 h-3" />
              <span>W trasie</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Dodaj</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};