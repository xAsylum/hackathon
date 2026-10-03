import React from 'react';
import {
  Sparkles,
  Clock,
  ShieldCheck,
  Accessibility,
  Coffee,
  Landmark,
  Trees,
  Eye,
  Moon
} from 'lucide-react';
import { useAppStore } from '../store/UseAppStore.ts';
import { Mood, Category } from '../types';

const MOODS: { id: Mood; label: string; icon: React.ElementType }[] = [
  { id: 'chill', label: 'Spokój & Parki', icon: Trees },
  { id: 'culture', label: 'Kultura & Historia', icon: Landmark },
  { id: 'night_vibe', label: 'Nocne Klimaty', icon: Moon },
  { id: 'quick_walk', label: 'Szybki Spacer', icon: Sparkles },
];

const CATEGORIES: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: 'culture', label: 'Kultura', icon: Landmark },
  { id: 'nature', label: 'Zieleń', icon: Trees },
  { id: 'food', label: 'Gastronomia', icon: Coffee },
  { id: 'viewpoint', label: 'Widoki', icon: Eye },
];

export const PreferencesForm: React.FC = () => {
  const { preferences, setPreferences } = useAppStore();

  const toggleCategory = (cat: Category) => {
    const exists = preferences.selectedCategories.includes(cat);
    const updated = exists
      ? preferences.selectedCategories.filter((c) => c !== cat)
      : [...preferences.selectedCategories, cat];
    setPreferences({ selectedCategories: updated });
  };

  return (
    <div className="space-y-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-sm text-sm">
      {/* 1. Nastrój (Mood) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Nastrój wycieczki
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map(({ id, label, icon: Icon }) => {
            const active = preferences.mood === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPreferences({ mood: id })}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                  active
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-xs truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dostępny czas */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Dostępny czas
          </label>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {preferences.availableTimeMinutes} min ({Math.round(preferences.availableTimeMinutes / 60 * 10) / 10}h)
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="360"
          step="30"
          value={preferences.availableTimeMinutes}
          onChange={(e) => setPreferences({ availableTimeMinutes: Number(e.target.value) })}
          className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>30m</span>
          <span>2h</span>
          <span>4h</span>
          <span>6h</span>
        </div>
      </div>

      {/* 3. Filtry Smart City */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Priorytety miejskie
        </label>

        {/* Przełącznik oświetlenia */}
        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-200">Korytarz oświetlony (noc)</span>
          </div>
          <input
            type="checkbox"
            checked={preferences.prioritizeWellLit}
            onChange={(e) => setPreferences({ prioritizeWellLit: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-900"
          />
        </label>

        {/* Przełącznik dostępności */}
        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-slate-200">Bez barier (wózki / windy)</span>
          </div>
          <input
            type="checkbox"
            checked={preferences.accessibleOnly}
            onChange={(e) => setPreferences({ accessibleOnly: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-900"
          />
        </label>
      </div>

      {/* 4. Kategorie */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Kategorie
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isSelected = preferences.selectedCategories.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleCategory(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                  isSelected
                    ? 'bg-slate-700 border-slate-500 text-white'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};