import React from 'react';
import {
  Sparkles,
  Clock,
  ShieldCheck,
  Accessibility,
  Utensils,
  Landmark,
  Trees,
  Moon,
  PartyPopper,
  Wine,
  Eye,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Mood, Category } from '../types';

interface MoodConfig {
  id: Mood;
  label: string;
  icon: React.ElementType;
  categories: Category[];
  defaultTime: number;
  prioritizeGreen: boolean;
}

const MOODS: MoodConfig[] = [
  {
    id: 'chill',
    label: 'Spokój & Parki',
    icon: Trees,
    categories: ['nature', 'culture'],
    defaultTime: 90,
    prioritizeGreen: true,
  },
  {
    id: 'culture',
    label: 'Kultura & Historia',
    icon: Landmark,
    categories: ['history', 'culture'],
    defaultTime: 120,
    prioritizeGreen: true,
  },
  {
    id: 'night_vibe',
    label: 'Nocne Klimaty',
    icon: Moon,
    categories: ['nightlife', 'entertainment', 'food'],
    defaultTime: 120,
    prioritizeGreen: false,
  },
  {
    id: 'quick_walk',
    label: 'Szybki Spacer',
    icon: Sparkles,
    categories: ['history', 'nature'],
    defaultTime: 45,
    prioritizeGreen: false,
  },
];

const CATEGORIES: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: 'history', label: 'Zabytki', icon: Landmark },
  { id: 'viewpoint', label: 'Widoki', icon: Eye },
  { id: 'culture', label: 'Kultura & Sztuka', icon: Sparkles },
  { id: 'nature', label: 'Parki & Zieleń', icon: Trees },
  { id: 'food', label: 'Gastronomia', icon: Utensils },
  { id: 'nightlife', label: 'Bary & Puby', icon: Wine },
  { id: 'entertainment', label: 'Rozrywka', icon: PartyPopper },
];

export const PreferencesForm: React.FC = () => {
  const { preferences, setPreferences } = useAppStore();

  const handleMoodSelect = (moodConfig: MoodConfig) => {
    setPreferences({
      mood: moodConfig.id,
      selectedCategories: moodConfig.categories,
      availableTimeMinutes: moodConfig.defaultTime,
      prioritizeGreen: moodConfig.prioritizeGreen,
    });
  };

  const toggleCategory = (cat: Category) => {
    const exists = preferences.selectedCategories.includes(cat);
    const updated = exists
      ? preferences.selectedCategories.filter((c) => c !== cat)
      : [...preferences.selectedCategories, cat];
    setPreferences({ selectedCategories: updated });
  };

  return (

    <div className="space-y-5 bg-neutral-200/90 p-4 rounded-xl border border-neutral-200 shadow-sm text-sm">
      {/* 1. Nastrój (Mood) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
          Typ wycieczki
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map((moodConfig) => {
            const { id, label, icon: Icon } = moodConfig;
            const active = preferences.mood === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleMoodSelect(moodConfig)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${active

                  ? 'bg-emerald-800/70 border-emerald-800 text-neutral-200'
                  : 'bg-neutral-100 border-emerald-800 text-emerald-800 font-medium hover:bg-emerald-800/30'
                  }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-neutral-200' : 'text-emerald-800'}`} />
                <span className="text-xs truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>



      {/* 3. Filtry Smart City */}
      <div className="space-y-2 pt-2 border-t border-emerald-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Priorytety miejskie
        </label>

        {/* Przełącznik terenów zielonych */}
        <label className="flex items-center justify-between p-2 rounded-lg bg-emerald-800/10 border border-emerald-800/20 text-emerald-800 cursor-pointer hover:bg-emerald-800/20 transition-colors">
          <div className="flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-medium">Tereny zielone</span>
          </div>
          <input
            type="checkbox"
            checked={preferences.prioritizeGreen}
            onChange={(e) => setPreferences({ prioritizeGreen: e.target.checked })}
            className="w-4 h-4 rounded border-emerald-800 text-emerald-600 focus:ring-emerald-500/20 bg-white cursor-pointer"
          />
        </label>

        {/* Przełącznik dostępności */}
        <label className="flex items-center justify-between p-2 rounded-lg bg-emerald-800/10 border-emerald-800 text-emerald-800 cursor-pointer hover:bg-emerald-800/50 transition-colors">
          <div className="flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium">Ułatwienia dostępu</span>
          </div>
          <input
            type="checkbox"
            checked={preferences.accessibleOnly}
            onChange={(e) => setPreferences({ accessibleOnly: e.target.checked })}
            className="w-4 h-4 rounded border-blue-400 text-blue-600 focus:ring-blue-500/20 bg-white cursor-pointer"
          />
        </label>
      </div>

      {/* 4. Kategorie */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
          Kategorie
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isSelected = preferences.selectedCategories.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleCategory(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors border text-left ${isSelected
                  ? 'bg-emerald-800/70 border-emerald-800 text-neutral-200'
                  : 'bg-emerald-800/10 border-emerald-800 text-emerald-800 font-medium hover:bg-emerald-800/30'

                  }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};