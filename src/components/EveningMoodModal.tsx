import React, { useState } from 'react';
import { MoodCategory, MoodLog, GeoLocationInfo } from '../types';
import { getCurrentGeoLocation } from '../lib/geo';
import { Sparkles, MapPin, X, Heart, SunMedium, CloudSun, Cloud, CloudRain, AlertTriangle } from 'lucide-react';

interface EveningMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMood: (moodData: Omit<MoodLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  existingTodayMood?: MoodLog | null;
  isEveningPrompt?: boolean;
}

const MOOD_OPTIONS: {
  category: MoodCategory;
  score: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { category: 'great', score: 5, label: 'Radiant & Great', sublabel: 'Thriving, energized', icon: SunMedium, color: 'text-amber-500', bg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' },
  { category: 'good', score: 4, label: 'Good & Positive', sublabel: 'Content, engaged', icon: CloudSun, color: 'text-emerald-500', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' },
  { category: 'centered', score: 3, label: 'Centered & Calm', sublabel: 'Reflective, steady', icon: Cloud, color: 'text-sky-500', bg: 'hover:bg-sky-50 dark:hover:bg-sky-950/30 border-sky-200 dark:border-sky-900/50' },
  { category: 'low', score: 2, label: 'Low & Drained', sublabel: 'Tired, weary', icon: CloudRain, color: 'text-indigo-400', bg: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50' },
  { category: 'down', score: 1, label: 'Down / Overwhelmed', sublabel: 'Struggling, heavy', icon: AlertTriangle, color: 'text-rose-500', bg: 'hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' },
];

export const EveningMoodModal: React.FC<EveningMoodModalProps> = ({
  isOpen,
  onClose,
  onSaveMood,
  existingTodayMood,
  isEveningPrompt = false,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedCategory, setSelectedCategory] = useState<MoodCategory>(
    existingTodayMood?.mood || 'centered'
  );
  const [energy, setEnergy] = useState<number>(existingTodayMood?.energy || 3);
  const [note, setNote] = useState<string>(existingTodayMood?.note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [geoTag, setGeoTag] = useState<GeoLocationInfo | undefined>(existingTodayMood?.geoLocation);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  if (!isOpen) return null;

  const handleFetchLocation = async () => {
    setIsGettingLocation(true);
    const loc = await getCurrentGeoLocation();
    if (loc) setGeoTag(loc);
    setIsGettingLocation(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Auto-fetch location if not present yet
      let finalGeo = geoTag;
      if (!finalGeo) {
        finalGeo = await getCurrentGeoLocation();
      }

      const foundOption = MOOD_OPTIONS.find((o) => o.category === selectedCategory);
      const score = foundOption ? foundOption.score : 3;

      await onSaveMood({
        date: todayStr,
        mood: selectedCategory,
        score,
        energy,
        note: note.trim(),
        geoLocation: finalGeo,
      });
      onClose();
    } catch (err) {
      console.error("Failed to save mood:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="evening-mood-modal-backdrop"
    >
      <div 
        id="evening-mood-modal-card"
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEveningPrompt ? "Evening Sol Reflection" : "Daily Mood Check-In"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
            How are you feeling today?
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Capture your internal Sol climate. A quick moment of honesty shapes mindful self-awareness.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Selector Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              State of Mind
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MOOD_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedCategory === opt.category;
                return (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => setSelectedCategory(opt.category)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-stone-900 dark:border-amber-400 bg-stone-50 dark:bg-stone-800 ring-2 ring-stone-900/10 dark:ring-amber-400/20'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 ' + opt.bg
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950' : opt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {opt.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Energy Level
              </label>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                {energy === 1 && "Exhausted (1/5)"}
                {energy === 2 && "Low Battery (2/5)"}
                {energy === 3 && "Balanced (3/5)"}
                {energy === 4 && "Active (4/5)"}
                {energy === 5 && "High Vigor (5/5)"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-stone-200 dark:bg-stone-800 rounded-lg"
            />
          </div>

          {/* Optional Short Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              Reflective Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What shaped your mood today? Key events, conversations, or inner thoughts..."
              className="w-full p-3 text-xs sm:text-sm rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Geo-tag section */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {geoTag?.cityOrRegion 
                  ? `Geo-tagged: ${geoTag.cityOrRegion}` 
                  : "Include current location tag"}
              </span>
            </div>
            {!geoTag && (
              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={isGettingLocation}
                className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50"
              >
                {isGettingLocation ? "Locating..." : "Tag Location"}
              </button>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? "Saving Sol..." : "Save Today's Mood"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
