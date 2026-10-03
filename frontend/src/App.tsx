import React from 'react';
import { Compass, ShoppingBag, Map as MapIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { PreferencesForm } from './components/PreferencesForm';
import { PlacesList } from './components/PlacesList';

export default function App() {
  const { cart, isRouteGenerated, setIsRouteGenerated } = useAppStore();

  // WIDOK 1: Pełnoekranowy Kreator Trasy (Landing Page)
  if (!isRouteGenerated) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Górny pasek nawigacyjny */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
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
                onClick={() => setIsRouteGenerated(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <span>Generuj trasę</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Główna sekcja kreatora */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Zaplanuj bezpieczny i klimatyczny spacer
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Dopasuj trasę do nastroju, dostępnego czasu i preferencji miejskich (oświetlenie nocne, trasy bez barier).
            </p>
          </div>

          {/* Dwie kolumny na dużym ekranie: po lewej filtry, po prawej lista atrakcji */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 sticky top-24">
              <PreferencesForm />
            </div>

            <div className="lg:col-span-7">
              <PlacesList />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // WIDOK 2: Nawigacja na Mapie z panelem bocznym
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Panel boczny (Sidebar z opcją edycji) */}
      <aside className="w-[420px] flex-shrink-0 h-full flex flex-col border-r border-slate-800/80 bg-slate-950 shadow-2xl z-10">
        <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <button
            type="button"
            onClick={() => setIsRouteGenerated(false)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zmień parametry</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs bg-slate-800/80 px-2.5 py-1 rounded-full text-slate-300 border border-slate-700/50">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">{cart.length}</span>
            <span className="text-slate-400">miejsc</span>
          </div>
        </header>

        {/* Zawartość panelu w trybie mapy */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>Trasa wygenerowana pomyślnie</span>
            <span className="font-bold">2.4 km (~35 min)</span>
          </div>

          <PreferencesForm />
          <PlacesList />
        </div>
      </aside>

      {/* Kontener na Mapę (pełen prawy ekran) */}
      <main className="flex-1 h-full relative bg-slate-900 flex items-center justify-center">
        <div id="map-container" className="absolute inset-0 flex items-center justify-center text-slate-500">
          <div className="text-center space-y-3">
            <MapIcon className="w-14 h-14 mx-auto stroke-1 animate-pulse text-emerald-500/50" />
            <p className="text-base font-semibold text-slate-300">Widok Aktywnej Mapy</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tutaj wpinana jest mapa z wyrysowanym korytarzem bezpiecznej trasy GeoJSON.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}