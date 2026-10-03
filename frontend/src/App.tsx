import { Compass, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from './store/UseAppStore';
import { PreferencesForm } from './components/PreferencesForm';
import { PlacesList } from './components/PlacesList';
import { InteractiveMap } from './components/InteractiveMap';
import { MOCK_ROUTE } from './data/mockRoute';

export default function App() {
  const {
    allPlaces,
    cart,
    cartWasModified,
    isRouteGenerated,
    setIsRouteGenerated,
    removeFromCart,
  } = useAppStore();
  const demoPlaces = allPlaces.filter((place) => place.id === '1' || place.id === '4');
  const visiblePlaces = cart.length > 0 ? cart : cartWasModified ? [] : demoPlaces;

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans md:flex-row">
      {/* Panel boczny (Sidebar z opcją edycji) */}
      <aside className="z-10 flex h-[46vh] w-full flex-shrink-0 flex-col border-b border-slate-800/80 bg-slate-950 shadow-2xl md:h-full md:w-[420px] md:border-b-0 md:border-r">
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="mb-3 text-xs font-semibold text-emerald-300">
              Trasa wygenerowana pomyślnie
            </p>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">Dystans</dt>
                <dd className="text-sm font-bold text-white">
                  {(MOCK_ROUTE.stats.distance_m / 1000).toFixed(1)} km
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">Czas</dt>
                <dd className="text-sm font-bold text-white">{MOCK_ROUTE.stats.total_min} min</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">Zieleń</dt>
                <dd className="text-sm font-bold text-emerald-300">
                  {MOCK_ROUTE.stats.pct_green}%
                </dd>
              </div>
            </dl>
          </div>

          <PreferencesForm />
          <PlacesList />
        </div>
      </aside>

      {/* Kontener na Mapę (pełen prawy ekran) */}
      <main className="relative min-h-0 flex-1 bg-slate-900">
        <InteractiveMap
          data={MOCK_ROUTE}
          places={visiblePlaces}
          onRemovePlace={cart.length > 0 ? removeFromCart : undefined}
        />
      </main>
    </div>
  );
}