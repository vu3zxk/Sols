import React, { useState } from 'react';
import { MoodLog, UserReflection } from '../types';
import { generateMonthReview } from '../lib/geminiApi';
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
  RefreshCw
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
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter logs for selected month (YYYY-MM)
  const monthLogs = moodLogs.filter((m) => m.date.startsWith(selectedMonth));
  const monthReflections = reflections.filter((r) => r.createdAt.startsWith(selectedMonth));

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
    ? monthReflections.find((r) => r.createdAt.slice(0, 10) === highestDay?.date)
    : null;
  const lowestReflection = lowestDay
    ? monthReflections.find((r) => r.createdAt.slice(0, 10) === lowestDay?.date)
    : null;

  // Average score
  const avgScore = monthLogs.length > 0
    ? (monthLogs.reduce((acc, l) => acc + l.score, 0) / monthLogs.length).toFixed(1)
    : '0';

  const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const handleGenerateReview = async () => {
    setIsGenerating(true);
    try {
      const journalHighlights = monthReflections.slice(0, 5).map((r) => ({
        date: r.createdAt.slice(0, 10),
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
        initialGoals: "Mindful consistency, grounded self-awareness, and emotional balance.",
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
              Reflect upon your emotional arc: understand where you felt the highest and the lowest, and distill lasting wisdom.
            </p>
          </div>

          <button
            type="button"
            id="generate-month-review-btn"
            onClick={handleGenerateReview}
            disabled={isGenerating || monthLogs.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs disabled:opacity-50 self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
            <span>{isGenerating ? "Synthesizing..." : "Generate AI Month Review"}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Sols Tracked
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-1">
              {monthLogs.length}
            </p>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Daily check-ins this month
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
                  {highestDay.geoLocation?.cityOrRegion && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{highestDay.geoLocation.cityOrRegion}</span>
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
                No mood data logged for {monthLabel} yet.
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
                  {lowestDay.geoLocation?.cityOrRegion && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{lowestDay.geoLocation.cityOrRegion}</span>
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
