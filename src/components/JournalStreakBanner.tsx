import React, { useEffect } from 'react';
import { UserReflection } from '../types';
import { PenLine, Bell, Sparkles } from 'lucide-react';

interface JournalStreakBannerProps {
  reflections: UserReflection[];
  onStartJournal: () => void;
  dailyReminderEnabled?: boolean;
}

export const JournalStreakBanner: React.FC<JournalStreakBannerProps> = ({
  reflections,
  onStartJournal,
  dailyReminderEnabled = true,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasJournaledToday = reflections.some(
    (r) => r.createdAt.slice(0, 10) === todayStr || r.updatedAt.slice(0, 10) === todayStr
  );

  // Trigger web notification if enabled and permitted and not journaled today
  useEffect(() => {
    if (!dailyReminderEnabled || hasJournaledToday) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        // Notification already granted
        const notifiedKey = `sols_daily_notified_${todayStr}`;
        if (!localStorage.getItem(notifiedKey)) {
          new Notification('Sols - Daily Reflection Reminder', {
            body: "You haven't journaled for today yet. Take a mindful pause to capture your Sol.",
            icon: '/favicon.ico',
          });
          localStorage.setItem(notifiedKey, 'true');
        }
      }
    }
  }, [hasJournaledToday, dailyReminderEnabled, todayStr]);

  if (hasJournaledToday) {
    return (
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold">Today's Sol is Journaled!</span>
            <span className="text-emerald-600 dark:text-emerald-400 block text-[11px]">
              You've recorded your thoughts for today. Great mindfulness practice!
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartJournal}
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
        >
          Add Another Entry
        </button>
      </div>
    );
  }

  return (
    <div 
      id="journal-streak-reminder-banner"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 text-xs sm:text-sm shadow-2xs"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Bell className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900 dark:text-white">
              You haven't journaled today yet
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              Sol Reminder
            </span>
          </div>
          <p className="text-stone-600 dark:text-stone-300 text-xs mt-0.5">
            Preserve your streak and anchor today's insights before the sun sets.
          </p>
        </div>
      </div>

      <button
        type="button"
        id="journal-today-quick-btn"
        onClick={onStartJournal}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shrink-0 shadow-2xs"
      >
        <PenLine className="w-3.5 h-3.5" />
        <span>Journal Today</span>
      </button>
    </div>
  );
};
