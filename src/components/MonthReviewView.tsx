import React, { useState, useMemo } from 'react';
import { MoodLog, UserReflection } from '../types';
import { generateMonthReview } from '../lib/geminiApi';
import { getReadableLocationName } from '../lib/geo';
import { formatLocalDateKey, getTodayLocalDateKey } from '../lib/dateUtils';
import { 
  BarChart3, 
  Sparkles, 
  SunMedium, 
  CloudRain, 
  Calendar, 
  MapPin, 
  BookOpen, 
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MonthReviewViewProps {
  moodLogs: MoodLog[];
  reflections: UserReflection[];
}

export const MonthReviewView: React.FC<MonthReviewViewProps> = ({
  moodLogs,
  reflections,
}) => {
  const currentMonthKey = getTodayLocalDateKey().slice(0, 7);

  // Helper to extract YYYY-MM-DD based on local date
  const getLocalDateKey = (isoOrDateStr: string): string => {
    return formatLocalDateKey(isoOrDateStr);
  };

  const getMonthKey = (isoOrDateStr: string): string => {
    return formatLocalDateKey(isoOrDateStr).slice(0, 7);
  };

  // Collect all months that have any mood logs or journal reflections
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthKey);
    moodLogs.forEach((m) => monthSet.add(getMonthKey(m.date)));
    reflections.forEach((r) => monthSet.add(getMonthKey(r.createdAt)));
    return Array.from(monthSet).filter(Boolean).sort().reverse();
  }, [moodLogs, reflections, currentMonthKey]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter logs and reflections based on selectedMonth ('all' or 'YYYY-MM')
  const isAllTime = selectedMonth === 'all';

  const monthLogs = useMemo(() => {
    if (isAllTime) return moodLogs;
    return moodLogs.filter((m) => getMonthKey(m.date) === selectedMonth);
  }, [moodLogs, selectedMonth, isAllTime]);

  const monthReflections = useMemo(() => {
    if (isAllTime) return reflections;
    return reflections.filter((r) => getMonthKey(r.createdAt) === selectedMonth);
  }, [reflections, selectedMonth, isAllTime]);

  // Calculate distinct Sols tracked (unique days with either a mood log or reflection)
  const uniqueActiveSols = useMemo(() => {
    const solSet = new Set<string>();
    monthLogs.forEach((m) => solSet.add(getLocalDateKey(m.date)));
    monthReflections.forEach((r) => solSet.add(getLocalDateKey(r.createdAt)));
    return solSet;
  }, [monthLogs, monthReflections]);

  // Identify highest and lowest days
  let highestDay: MoodLog | null = null;
  let lowestDay: MoodLog | null = null;

  if (monthLogs.length > 0) {
    const sorted = [...monthLogs].sort((a, b) => b.score - a.score);
    highestDay = sorted[0];
    lowestDay = sorted[sorted.length - 1];
  }

  // Find reflection on highest and lowest days
  const highestReflection = highestDay
    ? monthReflections.find((r) => getLocalDateKey(r.createdAt) === getLocalDateKey(highestDay?.date || ''))
    : null;
  const lowestReflection = lowestDay
    ? monthReflections.find((r) => getLocalDateKey(r.createdAt) === getLocalDateKey(lowestDay?.date || ''))
    : null;

  // Average score
  const avgScore = monthLogs.length > 0
    ? (monthLogs.reduce((acc, l) => acc + l.score, 0) / monthLogs.length).toFixed(1)
    : '0';

  const formatMonthLabel = (mKey: string) => {
    if (mKey === 'all') return 'All Sols (All Time)';
    try {
      const [y, m] = mKey.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } catch {
      return mKey;
    }
  };

  const monthLabel = formatMonthLabel(selectedMonth);

  // Month navigation helpers
  const currentIdx = availableMonths.indexOf(selectedMonth);
  const handlePrevMonth = () => {
    if (currentIdx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIdx + 1]);
    }
  };
  const handleNextMonth = () => {
    if (currentIdx > 0) {
      setSelectedMonth(availableMonths[currentIdx - 1]);
    }
  };

  // Check if user has other entries in other months
  const otherMonthsCount = reflections.length - monthReflections.length;

  const handleGenerateReview = async () => {
    setIsGenerating(true);
    try {
      const journalHighlights = monthReflections.slice(0, 8).map((r) => ({
        date: getLocalDateKey(r.createdAt),
        title: r.title,
        snippet: r.initialContent.slice(0, 200),
      }));

      const res = await generateMonthReview({
        monthName: monthLabel,
        highestDay,
        lowestDay,
        avgMood: Number(avgScore),
        totalMoodLogs: monthLogs.length,
        journalHighlights,
        initialGoals: "Mindful consistency, emotional balance, intentional presence, and holistic personal growth.",
        todosCompleted: 0,
        todosTotal: 0,
      });

      setAiReview(res.review);
    } catch (err) {
      console.error("Month review generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Retrospective Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              Month-End Review
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Reflect upon your emotional arc: explore highest and lowest moments, track all active Sols, and synthesize wisdom.
            </p>
          </div>

          <button
            type="button"
            id="generate-month-review-btn"
            onClick={handleGenerateReview}
            disabled={isGenerating || (monthLogs.length === 0 && monthReflections.length === 0)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs disabled:opacity-50 self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
            <span>{isGenerating ? "Synthesizing..." : "Generate AI Retrospective"}</span>
          </button>
        </div>

        {/* Month Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              Review Period:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={currentIdx >= availableMonths.length - 1 || isAllTime}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 transition"
                title="Older Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Sols (Complete Journey)</option>
                {availableMonths.map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {formatMonthLabel(mKey)} {mKey === currentMonthKey ? ' (Current)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={currentIdx <= 0 || isAllTime}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 transition"
                title="Newer Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAllTime && (
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950/60 dark:hover:text-amber-300 transition"
              >
                View All Sols
              </button>
            )}
            {isAllTime && (
              <button
                type="button"
                onClick={() => setSelectedMonth(currentMonthKey)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition"
              >
                Switch to Current Month
              </button>
            )}
          </div>
        </div>

        {/* Helpful context notice if user has reflections in other months */}
        {!isAllTime && otherMonthsCount > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-2 text-xs">
            <span className="text-amber-800 dark:text-amber-300">
              Showing <strong>{monthLabel}</strong> ({uniqueActiveSols.size} active Sols, {monthReflections.length} journal entries). You have <strong>{otherMonthsCount}</strong> entries in previous months.
            </span>
            <button
              type="button"
              onClick={() => setSelectedMonth('all')}
              className="text-xs font-bold text-amber-900 dark:text-amber-200 underline shrink-0 hover:text-amber-700"
            >
              See All
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Sols Tracked
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-1">
              {uniqueActiveSols.size}
            </p>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {monthLogs.length} mood logs • {monthReflections.length} reflections
            </span>
          </div>

          <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Average Valence
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {avgScore} <span className="text-base text-stone-400 font-normal">/ 5</span>
            </p>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Emotional climate average
            </span>
          </div>

          <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Journal Entries
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-1">
              {monthReflections.length}
            </p>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Written reflections recorded
            </span>
          </div>
        </div>

        {/* Peak & Trough Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Highest Moment Card */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/20 dark:to-stone-900 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <SunMedium className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Highest Point (Peak Sol)
                  </span>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                    Where You Felt Best
                  </h3>
                </div>
              </div>
              {highestDay && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Score: {highestDay.score}/5
                </span>
              )}
            </div>

            {highestDay ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {new Date(`${highestDay.date}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {getReadableLocationName(highestDay.geoLocation) && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{getReadableLocationName(highestDay.geoLocation)}</span>
                    </>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-amber-200/50 dark:border-amber-900/40 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  <p className="font-medium mb-1 capitalize text-amber-800 dark:text-amber-300">
                    Mood: {highestDay.mood}
                  </p>
                  <p className="italic">
                    "{highestDay.note || "No specific note was logged, but your energy and mood were at their peak."}"
                  </p>
                </div>

                {highestReflection && (
                  <div className="pt-2 border-t border-amber-200/40 dark:border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                      Journal written on this Sol:
                    </span>
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-200 line-clamp-2">
                      {highestReflection.title}: "{highestReflection.initialContent}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 dark:text-stone-500 py-6 text-center">
                No mood check-ins recorded for {monthLabel}.
              </p>
            )}
          </div>

          {/* Lowest Moment Card */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-50/70 to-stone-50/40 dark:from-indigo-950/20 dark:to-stone-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Lowest Point (The Trough)
                  </span>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                    Where You Felt Lowest
                  </h3>
                </div>
              </div>
              {lowestDay && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-200/80 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200">
                  Score: {lowestDay.score}/5
                </span>
              )}
            </div>

            {lowestDay ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {new Date(`${lowestDay.date}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {getReadableLocationName(lowestDay.geoLocation) && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{getReadableLocationName(lowestDay.geoLocation)}</span>
                    </>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-indigo-200/50 dark:border-indigo-900/40 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  <p className="font-medium mb-1 capitalize text-indigo-800 dark:text-indigo-300">
                    Mood: {lowestDay.mood}
                  </p>
                  <p className="italic">
                    "{lowestDay.note || "You noted heavy weather or exhaustion on this Sol."}"
                  </p>
                </div>

                {lowestReflection && (
                  <div className="pt-2 border-t border-indigo-200/40 dark:border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                      Journal written on this Sol:
                    </span>
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-200 line-clamp-2">
                      {lowestReflection.title}: "{lowestReflection.initialContent}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 dark:text-stone-500 py-6 text-center">
                No low data recorded for {monthLabel}.
              </p>
            )}
          </div>
        </div>

        {/* AI Synthesis Box */}
        {aiReview && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                Sols AI Month Retrospective
              </h2>
            </div>
            <div className="text-stone-800 dark:text-stone-200 prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown>{aiReview}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

