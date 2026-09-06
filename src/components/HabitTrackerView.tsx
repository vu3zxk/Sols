import React, { useState } from 'react';
import { Habit } from '../types';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  CalendarDays 
} from 'lucide-react';

interface HabitTrackerViewProps {
  habits: Habit[];
  onSaveHabit: (habit: Habit) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  userId: string;
}

// Check if habit has 3 consecutive fails (today, yesterday, 2 days ago not completed)
export function getHabitFailureAlerts(habits: Habit[]): { habit: Habit; missedDays: number }[] {
  const alerts: { habit: Habit; missedDays: number }[] = [];
  const today = new Date();

  // Create date keys for the last 3 days
  const last3Days: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    last3Days.push(d.toISOString().slice(0, 10));
  }

  habits.forEach((habit) => {
    const completedSet = new Set(habit.completedDates || []);
    // Check how many of the last 3 days were missed
    const all3Missed = last3Days.every((dateStr) => !completedSet.has(dateStr));
    if (all3Missed) {
      alerts.push({ habit, missedDays: 3 });
    }
  });

  return alerts;
}

// Calculate current streak for habit
function calculateStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;
  const set = new Set(completedDates);
  const today = new Date();
  let streak = 0;

  // Check today or yesterday as start
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let currentCheck = set.has(todayStr) ? today : (set.has(yesterdayStr) ? yesterday : null);
  if (!currentCheck) return 0;

  while (true) {
    const checkStr = currentCheck.toISOString().slice(0, 10);
    if (set.has(checkStr)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export const HabitTrackerView: React.FC<HabitTrackerViewProps> = ({
  habits,
  onSaveHabit,
  onDeleteHabit,
  userId,
}) => {
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Mindfulness');
  const [isAdding, setIsAdding] = useState(false);

  // Generate last 7 days for the weekly grid
  const today = new Date();
  const weekDays: { dateStr: string; label: string; dayNum: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    weekDays.push({
      dateStr: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }

  const failureAlerts = getHabitFailureAlerts(habits);

  const handleToggleHabitDay = async (habit: Habit, dateStr: string) => {
    const currentDates = habit.completedDates || [];
    const exists = currentDates.includes(dateStr);
    const updatedDates = exists
      ? currentDates.filter((d) => d !== dateStr)
      : [...currentDates, dateStr];

    const updatedHabit: Habit = {
      ...habit,
      completedDates: updatedDates,
      updatedAt: new Date().toISOString(),
    };

    await onSaveHabit(updatedHabit);
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: newHabitName.trim(),
      category: newHabitCategory,
      completedDates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveHabit(newHabit);
    setNewHabitName('');
    setIsAdding(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Daily Cadence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              Habit & Practice Tracker
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Cultivate consistency through small, steady actions. Sols alerts you if a habit has lapsed for 3 consecutive days.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>

        {/* 3 Continuous Fails Alert Banner */}
        {failureAlerts.length > 0 && (
          <div 
            id="habit-streak-alert"
            className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800 text-stone-900 dark:text-stone-100 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-300">
                  Consistency Alert: 3 Consecutive Days Missed
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
                  The following {failureAlerts.length === 1 ? 'habit has' : 'habits have'} not been marked for 3 days in a row:
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {failureAlerts.map(({ habit }) => (
                    <span 
                      key={habit.id}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 border border-amber-200 dark:border-stone-700 shadow-2xs"
                    >
                      {habit.name}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-2 font-medium">
                  Tip: Complete a tiny, 2-minute version today to reignite your momentum.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Habit Form */}
        {isAdding && (
          <form
            onSubmit={handleCreateHabit}
            className="p-5 sm:p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              Create New Daily Habit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Habit name (e.g., 10m Meditation, Morning Jog, Read 15 pages)..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  autoFocus
                />
              </div>
              <div>
                <select
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Focus & Work">Focus & Work</option>
                  <option value="Creativity">Creativity</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newHabitName.trim()}
                className="px-5 py-2 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 disabled:opacity-40"
              >
                Save Habit
              </button>
            </div>
          </form>
        )}

        {/* Habits List */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Active Habits ({habits.length})
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              {weekDays.map((day) => (
                <div key={day.dateStr} className="w-8 sm:w-10 text-center">
                  <span className="block text-[10px] text-stone-400 font-semibold">{day.label}</span>
                  <span className={`block text-xs font-bold ${day.isToday ? 'text-amber-600 dark:text-amber-400' : 'text-stone-700 dark:text-stone-300'}`}>
                    {day.dayNum}
                  </span>
                </div>
              ))}
              <div className="w-8 sm:w-12 text-center">
                <span className="text-[10px] text-stone-400 font-semibold">Streak</span>
              </div>
            </div>
          </div>

          {habits.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                No habits added yet. Click "New Habit" above to start tracking your daily cadence.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {habits.map((habit) => {
                const streak = calculateStreak(habit.completedDates || []);
                const completedDates = new Set(habit.completedDates || []);

                return (
                  <div key={habit.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {habit.name}
                      </p>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-medium">
                        {habit.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      {weekDays.map((day) => {
                        const isDone = completedDates.has(day.dateStr);
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => handleToggleHabitDay(habit, day.dateStr)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-stone-50 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 hover:border-amber-400 border border-stone-200/60 dark:border-stone-800'
                            }`}
                            title={`${habit.name} on ${day.dateStr}: ${isDone ? 'Completed' : 'Click to complete'}`}
                          >
                            {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
                        );
                      })}

                      {/* Streak counter */}
                      <div className="w-8 sm:w-12 flex items-center justify-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{streak}</span>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
