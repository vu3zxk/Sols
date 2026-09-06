import React from 'react';
import { UserReflection, MoodLog, MonthlyPlan, Habit, BucketItem, NavigationTab } from '../types';
import { WeeklyMoodTrend } from './WeeklyMoodTrend';
import { CaringAlert } from './CaringAlert';
import { JournalStreakBanner } from './JournalStreakBanner';
import { 
  Sparkles, 
  PenLine, 
  Target, 
  Flame, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  SunMedium,
  Check
} from 'lucide-react';

interface MainDashboardProps {
  reflections: UserReflection[];
  moodLogs: MoodLog[];
  monthlyPlan: MonthlyPlan | null;
  habits: Habit[];
  bucketItems: BucketItem[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenNewJournal: (initialPrompt?: string) => void;
  onSelectReflection: (reflectionId: string) => void;
  onOpenMoodCheckIn: () => void;
  onToggleHabitToday: (habit: Habit) => Promise<void>;
  onToggleMonthlyTodo: (todoId: string) => Promise<void>;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  reflections,
  moodLogs,
  monthlyPlan,
  habits,
  bucketItems,
  onNavigateTab,
  onOpenNewJournal,
  onSelectReflection,
  onOpenMoodCheckIn,
  onToggleHabitToday,
  onToggleMonthlyTodo,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMood = moodLogs.find((m) => m.date === todayStr);

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Recent 3 reflections
  const recentReflections = reflections.slice(0, 3);

  // Today's habits completion
  const completedHabitsToday = habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;

  // Monthly plan progress
  const todos = monthlyPlan?.todos || [];
  const completedTodos = todos.filter((t) => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  // Bucket item highlight
  const pendingBucket = bucketItems.find((b) => !b.completed) || bucketItems[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Sol Greeting & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              <span>Today's Sol • {formattedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              Mindful Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Your comprehensive panoramic overview of emotional climate, habits, goals, and reflections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="dashboard-open-mood-btn"
              onClick={onOpenMoodCheckIn}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-amber-400 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors shadow-2xs"
            >
              <SunMedium className="w-4 h-4 text-amber-500" />
              <span>{todayMood ? `Mood: ${todayMood.mood} (${todayMood.score}/5)` : 'Log Mood Today'}</span>
            </button>

            <button
              type="button"
              id="dashboard-new-journal-btn"
              onClick={() => onOpenNewJournal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs"
            >
              <PenLine className="w-4 h-4" />
              <span>New Sol Entry</span>
            </button>
          </div>
        </div>

        {/* 3-day Low Mood Compassionate Alert */}
        <CaringAlert
          moodLogs={moodLogs}
          onOpenJournalWithPrompt={(prompt) => onOpenNewJournal(prompt)}
        />

        {/* Journal Streak Reminder Banner */}
        <JournalStreakBanner
          reflections={reflections}
          onStartJournal={() => onOpenNewJournal()}
        />

        {/* Weekly Mood Trend Visual */}
        <WeeklyMoodTrend
          moodLogs={moodLogs}
          onOpenCheckIn={onOpenMoodCheckIn}
        />

        {/* Quick Grid: Habits & Monthly Goals Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habits Snapshot */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white">
                    Today's Practices
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {completedHabitsToday} of {habits.length} completed today
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('habits')}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400">
                No habits created yet. Tap "View all" to begin tracking.
              </div>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 4).map((h) => {
                  const isDone = (h.completedDates || []).includes(todayStr);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/60"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {h.name}
                        </p>
                        <span className="text-[10px] text-stone-400 uppercase font-medium">
                          {h.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleHabitToday(h)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white dark:bg-stone-800 text-stone-300 dark:text-stone-600 hover:border-amber-400 border border-stone-200 dark:border-stone-700'
                        }`}
                        title={isDone ? "Completed today" : "Mark as done"}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs">+</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Intentions Snapshot */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white">
                    Monthly Intentions
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {completedTodos} of {todos.length} achieved ({progressPercent}%)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Full List</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todos.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400">
                No monthly goals converted yet. Start your month's vision!
              </div>
            ) : (
              <div className="space-y-2">
                {todos.slice(0, 4).map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/60"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleMonthlyTodo(todo.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-400 shrink-0 hover:text-amber-500" />
                      )}
                      <span className={`text-xs font-medium truncate ${todo.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                        {todo.title}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Journal Reflections & Bucket List Feature */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reflections (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white">
                Recent Sol Reflections
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('journal')}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>All Journal Entries ({reflections.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentReflections.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400">
                No reflections recorded yet. Tap "New Sol Entry" above to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {recentReflections.map((ref) => (
                  <div
                    key={ref.id}
                    onClick={() => {
                      onSelectReflection(ref.id);
                      onNavigateTab('journal');
                    }}
                    className="p-4 rounded-2xl border border-stone-100 dark:border-stone-800/80 hover:border-amber-300 dark:hover:border-amber-700 bg-stone-50/40 dark:bg-stone-800/30 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {ref.title || "Untitled Sol"}
                      </span>
                      <span className="text-[11px] text-stone-400 shrink-0">
                        {new Date(ref.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {ref.aiSummary ? ref.aiSummary.slice(0, 150) : ref.initialContent.slice(0, 150) || "No initial text"}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {ref.geoLocation?.cityOrRegion && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{ref.geoLocation.cityOrRegion}</span>
                        </span>
                      )}
                      {ref.messages.length > 0 && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          {ref.messages.length} dialogue turns
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bucket List Star / Aspiration (1 col) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white">
                    Life Horizon
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('bucket')}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  View list
                </button>
              </div>

              {pendingBucket ? (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Aspiration in Focus
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    {pendingBucket.title}
                  </h4>
                  {pendingBucket.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3">
                      {pendingBucket.description}
                    </p>
                  )}
                  {pendingBucket.targetDate && (
                    <span className="text-[10px] text-stone-400 block pt-1">
                      Target: {pendingBucket.targetDate}
                    </span>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400">
                  No bucket list dreams added yet.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('month-review')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <span>Explore Month-End Review</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
