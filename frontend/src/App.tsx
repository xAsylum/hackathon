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
      <div className="min-h-screen w-screen bg-neutral-300 text-neutral-200 flex flex-col font-sans pb-20">
        <header className="bg-emerald-800 backdrop-blur sticky top-0 z-20 px-6 py-4 shadow-xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-800/10 border border-emerald-300 text-emerald-300">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight text-white">Detour</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-taupe-900 px-3.5 py-1.5 rounded-full border border-taupe-800 text-taupe-300">
                <ShoppingBag className="w-4 h-4 text-emerald-300" />
                <span className="font-semibold text-emerald-300">{cart.length}</span>
                <span className="text-taupe-400">wybranych miejsc</span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isLoading}
                onClick={() => generateRoute()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-taupe-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
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
          <div className="text-center mx-auto mb-10 space-y-2 bg-neutral-200/90 p-2 rounded-xl border border-neutral-200 shadow-md ">
            <h2 className="text-3xl font-extrabold tracking-tight text-emerald-800 sm:text-4xl">
              Zaplanuj spacer po mieście
            </h2>
            <p className="text-emerald-800 text-sm md:text-base">
              Wybierz nastrój, ustal budżet, czas i dodaj atrakcje.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <PreferencesForm />

              <div className="text-center mx-auto mb-10 space-y-2 bg-neutral-200/90 p-2 rounded-xl border border-neutral-200 shadow-md ">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
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
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-200 text-taupe-100 font-sans">
      <aside className="w-[420px] flex-shrink-0 h-full flex flex-col border-r border-taupe-800/80 bg-neutral-200 shadow-2xl z-10">
        <header className="p-4 border-b border-taupe-800 flex items-center justify-between bg-neutral-200">
          <button
            type="button"
            onClick={() => setIsRouteGenerated(false)}
            className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Powrót do kreatora</span>
          </button>

          <div className="flex items-center gap-1 bg-neutral-200 p-1 rounded-lg border border-taupe-800">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTab === 'cart'
                  ? 'bg-emerald-800/10 text-emerald-800 font-medium'
                  : 'text-emerald-800'
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
                  ? 'bg-emerald-800/10 text-emerald-800 font-medium'
                  : 'text-emerald-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtry</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {routeData && (
            <div className="p-3 bg-emerald-800/10 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
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
      <main className="flex-1 h-full relative bg-taupe-900 flex items-center justify-center">
        <div id="map-container" className="absolute inset-0 flex items-center justify-center text-taupe-500">
          <div className="text-center space-y-3">
            <MapIcon className="w-14 h-14 mx-auto stroke-1 animate-pulse text-emerald-500/50" />
            <p className="text-base font-semibold text-taupe-300">Widok Mapy Gotowy do Spięcia</p>
            <p className="text-xs text-taupe-500 max-w-xs mx-auto">
              Osoba od mapy importuje <code>useAppStore</code>, czyta <code>cart</code> oraz <code>routeData.geojson</code> i rysuje trasę.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}