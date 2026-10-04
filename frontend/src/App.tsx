import React, { useEffect, useState, useMemo } from 'react';
import {
  Compass,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  ListOrdered,
  Loader2,
  Trees,
} from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { PreferencesForm } from './components/PreferencesForm';
import { PlacesList } from './components/PlacesList';
import { ItineraryCart } from './components/ItineraryCart';
import { InteractiveMap } from './components/InteractiveMap';
import type { MapRouteData, RouteResponse } from './types';

const EMPTY_ROUTE_DATA: MapRouteData = {
  stats: {
    distance_m: 0,
    total_min: 0,
    pct_green: 0,
  },
  route: {
    type: 'FeatureCollection',
    features: [],
  },
};

// Bezpieczny konwerter danych trasy z API do struktury wymaganej przez mapę
function asMapRouteData(routeData: any): MapRouteData {
  if (!routeData) return EMPTY_ROUTE_DATA;

  // 1. Backend zwrócił już gotową strukturę FeatureCollection w route
  if (routeData.route?.features) {
    return {
      stats: {
        distance_m: routeData.stats?.distance_m ?? routeData.distance_meters ?? 0,
        total_min:
          routeData.stats?.total_min ??
          Math.round((routeData.duration_seconds ?? 0) / 60),
        pct_green: routeData.stats?.pct_green ?? routeData.pct_green ?? 0,
      },
      route: routeData.route,
    };
  }

  // 2. Backend zwrócił GeoJSON z OSRM lub FeatureCollection
  const rawFeatures = routeData.geojson?.features;
  const features = Array.isArray(rawFeatures)
    ? rawFeatures
    : [
      {
        type: 'Feature' as const,
        geometry: routeData.geojson || { type: 'LineString', coordinates: [] },
        properties: {
          green: 0.0,
          traffic: 0.1,
          lit: false,
          highway: 'pedestrian',
        },
      },
    ];

  return {
    stats: {
      distance_m: routeData.stats?.distance_m ?? routeData.distance_meters ?? 0,
      total_min:
        routeData.stats?.total_min ??
        Math.round((routeData.duration_seconds ?? 0) / 60),
      pct_green: routeData.stats?.pct_green ?? routeData.pct_green ?? 0,
    },
    route: {
      type: 'FeatureCollection',
      features,
    },
  };
}

export default function App() {
  const {
    cart,
    preferences,
    setPreferences,
    isRouteGenerated,
    setIsRouteGenerated,
    generateRoute,
    isLoading,
    loadPlaces,
    routeData,
    removeFromCart,
    toggleLike,
  } = useAppStore();

  const mapRouteData = useMemo(() => asMapRouteData(routeData), [routeData]);
  const [activeTab, setActiveTab] = useState<'cart' | 'filters'>('cart');

  // Pobranie punktów z backendu przy starcie
  useEffect(() => {
    if (typeof loadPlaces === 'function') {
      loadPlaces();
    }
  }, [loadPlaces]);

  // WIDOK 1: Pełnoekranowy Kreator Trasy
  if (!isRouteGenerated) {
    return (
      <div className="min-h-screen w-screen bg-neutral-100 text-neutral-800 flex flex-col font-sans pb-20">
        <header className="bg-emerald-800 backdrop-blur sticky top-0 z-20 px-6 py-4 shadow-xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-700/50 border border-emerald-400/40 text-emerald-200">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight text-white">Detour</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-emerald-950/70 px-3.5 py-1.5 rounded-full border border-emerald-700 text-emerald-200">
                <ShoppingBag className="w-4 h-4 text-emerald-300" />
                <span className="font-semibold text-emerald-300">{cart.length}</span>
                <span className="text-emerald-100/80">wybranych miejsc</span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isLoading}
                onClick={() => generateRoute()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 text-emerald-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optymalizacja trasy...</span>
                  </>
                ) : (
                  <>
                    <span>Stwórz trasę</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
          <div className="text-center mx-auto mb-10 space-y-2 bg-white/90 p-4 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-3xl font-extrabold tracking-tight text-emerald-800 sm:text-4xl">
              Zaplanuj spacer po mieście
            </h2>
            <p className="text-emerald-700 text-sm md:text-base">
              Wybierz nastrój, ustal budżet czasowy i dodaj atrakcje do swojego planu.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <PreferencesForm />

              <div className="bg-white/90 p-4 rounded-xl border border-neutral-200 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-3 flex items-center justify-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-emerald-800" />
                  Twój Plan Zwiedzania ({cart.length})
                </h3>
                <ItineraryCart />
              </div>
            </div>

            <div className="lg:col-span-7">
              <PlacesList />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // WIDOK 2: Nawigacja na Mapie
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 text-neutral-800 font-sans">
      <aside className="w-[420px] flex-shrink-0 h-full flex flex-col border-r border-neutral-200 bg-white shadow-2xl z-10">
        <header className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <button
            type="button"
            onClick={() => setIsRouteGenerated(false)}
            className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-600 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Powrót do kreatora</span>
          </button>

          <div className="flex items-center gap-1 bg-neutral-200/60 p-1 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${activeTab === 'cart'
                ? 'bg-white text-emerald-800 font-medium shadow-sm'
                : 'text-neutral-600 hover:text-emerald-800'
                }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Plan ({cart.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${activeTab === 'filters'
                ? 'bg-white text-emerald-800 font-medium shadow-sm'
                : 'text-neutral-600 hover:text-emerald-800'
                }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtry</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Przeliczanie nowej trasy...</span>
                  </>
                ) : (
                  <span>
                    {cart.length < 2
                      ? 'Dodaj min. 2 punkty do trasy'
                      : 'Trasa wyznaczona'}
                  </span>
                )}
              </p>
              {isLoading && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse font-medium">
                  Aktualizacja...
                </span>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-emerald-200/60">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold">Dystans</dt>
                <dd className="text-sm font-bold text-neutral-800">
                  {(mapRouteData.stats.distance_m / 1000).toFixed(1)} km
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold">Czas</dt>
                <dd className="text-sm font-bold text-neutral-800">
                  {mapRouteData.stats.total_min} min
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold">Zieleń</dt>
                <dd className="text-sm font-bold text-emerald-600">
                  {mapRouteData.stats.pct_green}%
                </dd>
              </div>
            </dl>
          </div>

          {activeTab === 'cart' ? (
            <ItineraryCart />
          ) : (
            <div className="space-y-6">
              <PreferencesForm />
              <PlacesList />
            </div>
          )}
        </div>
      </aside>

      <main className="relative min-h-0 flex-1 bg-slate-900">
        <InteractiveMap
          data={mapRouteData}
          places={cart}
          onRemovePlace={removeFromCart}
          onToggleLike={toggleLike}
        />
      </main>
    </div>
  );
}