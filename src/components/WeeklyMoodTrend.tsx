import React, { useState } from 'react';
import { MoodLog } from '../types';
import { getTodayLocalDateKey, formatLocalDateKey } from '../lib/dateUtils';
import { TrendingUp, TrendingDown, Minus, SunMedium, CloudSun, Cloud, CloudRain, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface WeeklyMoodTrendProps {
  moodLogs: MoodLog[];
  onOpenCheckIn?: (dateStr?: string) => void;
}

export const WeeklyMoodTrend: React.FC<WeeklyMoodTrendProps> = ({ moodLogs, onOpenCheckIn }) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Current date reference in local time
  const now = new Date();
  const todayKey = getTodayLocalDateKey();

  // Compute Sunday of the target week
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const baseSunday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - currentDayOfWeek + (weekOffset * 7),
    12, 0, 0
  );

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays: {
    dateStr: string;
    dayLabel: string;
    shortDate: string;
    isToday: boolean;
    log?: MoodLog;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseSunday);
    d.setDate(baseSunday.getDate() + i);
    const dateStr = formatLocalDateKey(d);
    const dayLabel = DAY_LABELS[i];
    const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;
    const isToday = dateStr === todayKey;
    const log = moodLogs.find((m) => formatLocalDateKey(m.date) === dateStr);

    weekDays.push({
      dateStr,
      dayLabel,
      shortDate,
      isToday,
      log,
    });
  }

  // Calculate week interval label
  const sundayDate = new Date(baseSunday);
  const saturdayDate = new Date(baseSunday);
  saturdayDate.setDate(baseSunday.getDate() + 6);
  const weekRangeLabel = `${sundayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${saturdayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  // Calculate average score for days that have logs
  const loggedDays = weekDays.filter((d) => d.log !== undefined);
  const avgScore = loggedDays.length > 0
    ? (loggedDays.reduce((acc, curr) => acc + (curr.log?.score || 3), 0) / loggedDays.length).toFixed(1)
    : null;

  // Determine trend direction comparing first half to second half
  let trendDirection: 'up' | 'down' | 'steady' = 'steady';
  if (loggedDays.length >= 2) {
    const firstScore = loggedDays[0].log?.score || 3;
    const lastScore = loggedDays[loggedDays.length - 1].log?.score || 3;
    if (lastScore > firstScore) trendDirection = 'up';
    else if (lastScore < firstScore) trendDirection = 'down';
  }

  const getMoodIcon = (score: number) => {
    if (score >= 5) return SunMedium;
    if (score === 4) return CloudSun;
    if (score === 3) return Cloud;
    if (score === 2) return CloudRain;
    return AlertTriangle;
  };

  const getMoodColor = (score: number) => {
    if (score >= 5) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    if (score === 4) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (score === 3) return 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800';
    if (score === 2) return 'text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Emotional Climate
            </span>
            {avgScore && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                Avg: {avgScore} / 5
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white mt-0.5">
            Weekly Mood Trend
          </h3>
        </div>

        {/* Controls & Trend */}
        <div className="flex items-center gap-3">
          {/* Week interval navigator */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white rounded-md transition hover:bg-stone-200/50"
              title="Previous Week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium px-1.5 text-stone-700 dark:text-stone-300 whitespace-nowrap">
              {weekRangeLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white rounded-md transition hover:bg-stone-200/50"
              title="Next Week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="text-[10px] font-semibold px-2 py-0.5 ml-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition"
              >
                Current
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            {trendDirection === 'up' && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trending Up</span>
              </span>
            )}
            {trendDirection === 'down' && (
              <span className="inline-flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Lower Valence</span>
              </span>
            )}
            {trendDirection === 'steady' && (
              <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium">
                <Minus className="w-3.5 h-3.5" />
                <span>Balanced</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual 7-day grid starting with Sun, Mon, Tue, Wed, Thu, Fri, Sat */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {weekDays.map((day) => {
          const hasLog = Boolean(day.log);
          const score = day.log?.score || 0;
          const Icon = getMoodIcon(score);

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all text-center ${
                day.isToday
                  ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-stone-100 dark:border-stone-800/60 bg-white dark:bg-stone-900/40'
              }`}
            >
              <span className={`text-[10px] sm:text-xs font-semibold ${day.isToday ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`}>
                {day.dayLabel}
              </span>
              <span className="text-[9px] text-stone-400 dark:text-stone-500 mb-2">
                {day.shortDate}
              </span>

              {hasLog ? (
                <button 
                  type="button"
                  onClick={() => onOpenCheckIn?.(day.dateStr)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border ${getMoodColor(score)} transition-transform hover:scale-110 cursor-pointer`}
                  title={`${day.log?.mood.toUpperCase()} (Score: ${score}/5)${day.log?.note ? ` - "${day.log.note}"` : ''} • Click to view or edit`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenCheckIn?.(day.dateStr)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:border-amber-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title={`Log mood for ${day.dayLabel}, ${day.shortDate}`}
                >
                  <span className="text-xs">+</span>
                </button>
              )}

              <span className="text-[10px] font-semibold text-stone-700 dark:text-stone-300 mt-2">
                {hasLog ? `${score}/5` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

