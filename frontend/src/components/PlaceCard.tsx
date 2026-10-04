import React from 'react';
import { Plus, Check, Clock, Accessibility, Heart } from 'lucide-react';
import { Place } from '../types';
import { useAppStore } from '../store/useAppStore';

interface PlaceCardProps {
  place: Place;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const {
    cart,
    addToCart,
    removeFromCart,
    toggleLike,
    pendingLikeIds,
  } = useAppStore();
  const isInCart = cart.some((item) => String(item.id) === String(place.id));
  const isLikePending = pendingLikeIds.includes(String(place.id));

  // Przyjazny tag: "castle", "restaurant / vegan" itp.
  const displayTag = place.monument_subtype
    ? `${place.monument_type} • ${place.monument_subtype}`
    : place.monument_type || place.category;

  return (
    <div className="p-3 bg-neutral-100 rounded-xl border border-emerald-800 transition-all flex flex-col justify-between gap-3 group hover:bg-emerald-800/10">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-emerald-800 text-sm leading-tight transition-colors">
            {place.name}
          </h4>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-800 text-neutral-200 border border-slate-700/50 flex-shrink-0 max-w-[130px] truncate">
            {place.category}
          </span>
        </div>

        {place.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-500" />
            {place.durationMinutes ?? 30} min
          </span>
          {place.isAccessible && (
            <span title={`Dostępność: ${place.wheelchair || 'tak'}`} className="flex items-center text-sky-400 gap-1 text-[11px]">
              <Accessibility className="w-3 h-3" />
              <span>Dostępne</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLikePending}
            onClick={() => toggleLike(place.id)}
            aria-label={place.isLiked ? 'Usuń polubienie' : 'Polub atrakcję'}
            aria-pressed={place.isLiked}
            title={place.isLiked ? 'Usuń polubienie' : 'Warto odwiedzić'}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:cursor-wait disabled:opacity-60 ${
              place.isLiked
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:border-rose-500/40 hover:text-rose-300'
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${place.isLiked ? 'fill-current' : ''}`}
            />
            <span>{place.likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => (isInCart ? removeFromCart(place.id) : addToCart(place))}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${            
            isInCart
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-emerald-800 hover:bg-emerald-500 text-neutral-200 shadow-sm'
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
    </div>
  );
};