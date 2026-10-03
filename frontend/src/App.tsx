import React, { useEffect, useState } from 'react';
import {
  Compass,
  ShoppingBag,
  Map as MapIcon,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  ListOrdered,
  Loader2
} from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { PreferencesForm } from './components/PreferencesForm';
import { PlacesList } from './components/PlacesList';
import { ItineraryCart } from './components/ItineraryCart';

export default function App() {
  const {
    cart,
    isRouteGenerated,
    setIsRouteGenerated,
    generateRoute,
    isLoading,
    loadPlaces,
    routeData
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'cart' | 'filters'>('cart');

  // Pobranie punktów z backendu przy starcie
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // WIDOK 1: Pełnoekranowy Kreator Trasy
  if (!isRouteGenerated) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight text-white">Detour</h1>
                <p className="text-xs text-slate-400">Smart Pedestrian Navigation</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800 text-slate-300">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-emerald-400">{cart.length}</span>
                <span className="text-slate-400">wybranych miejsc</span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isLoading}
                onClick={() => generateRoute()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optymalizacja trasy...</span>
                  </>
                ) : (
                  <>
                    <span>Generuj trasę</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Zaplanuj bezpieczny spacer po mieście
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Wybierz nastrój, ustal budżet czasowy i dodaj atrakcje do swojego planu.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <PreferencesForm />

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-emerald-400" />
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <aside className="w-[420px] flex-shrink-0 h-full flex flex-col border-r border-slate-800/80 bg-slate-950 shadow-2xl z-10">
        <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <button
            type="button"
            onClick={() => setIsRouteGenerated(false)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Powrót do kreatora</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTab === 'cart'
                  ? 'bg-emerald-500/10 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Plan ({cart.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTab === 'filters'
                  ? 'bg-emerald-500/10 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtry</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {routeData && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>Trasa wyznaczona:</span>
              <span className="font-bold">
                {(routeData.distance_meters / 1000).toFixed(1)} km (~{Math.round(routeData.duration_seconds / 60)} min)
              </span>
            </div>
          )}

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

      {/* PRAWY OBSZAR: Tu podpina się osoba od Mapy */}
      <main className="flex-1 h-full relative bg-slate-900 flex items-center justify-center">
        <div id="map-container" className="absolute inset-0 flex items-center justify-center text-slate-500">
          <div className="text-center space-y-3">
            <MapIcon className="w-14 h-14 mx-auto stroke-1 animate-pulse text-emerald-500/50" />
            <p className="text-base font-semibold text-slate-300">Widok Mapy Gotowy do Spięcia</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Osoba od mapy importuje <code>useAppStore</code>, czyta <code>cart</code> oraz <code>routeData.geojson</code> i rysuje trasę.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}