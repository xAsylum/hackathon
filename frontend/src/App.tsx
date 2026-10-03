import React from 'react';
import { Compass, ShoppingBag, Map as MapIcon } from 'lucide-react';
import { useAppStore } from './store/use_app_store';

export default function App() {
  const { cart } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* LEWY PANEL (Alicja): Formularz i Koszyk */}
      <aside className="w-[420px] flex-shrink-0 h-full flex flex-col border-r border-slate-800 bg-slate-950">
        <header className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400" />
            <h1 className="font-bold text-lg tracking-wide text-white">Detour</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{cart.length} przystanków</span>
          </div>
        </header>

        {/* Miejsce na Formularz i Karty (Faza 2) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-400">
            <p className="font-semibold text-slate-200 mb-1">Sekcja preferencji i filtrów</p>
            <p>Tutaj w Fazie 2 umieścimy Mood, Czas oraz przełączniki Smart City.</p>
          </section>

          <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-400">
            <p className="font-semibold text-slate-200 mb-1">Sekcja koszyka trasy</p>
            <p>Tutaj w Fazie 3 pojawi się lista wybranych przystanków ze zmianą kolejności.</p>
          </section>
        </div>
      </aside>

      {/* PRAWY OBSZAR: Kontener pod Mapę */}
      <main className="flex-1 h-full relative bg-slate-900 flex items-center justify-center">
        <div id="map-container" className="absolute inset-0 flex items-center justify-center text-slate-500">
          <div className="text-center space-y-2">
            <MapIcon className="w-12 h-12 mx-auto stroke-1 animate-pulse" />
            <p className="text-sm">Tu wepnij kontener Leaflet / MapLibre</p>
          </div>
        </div>
      </main>
    </div>
  );
}