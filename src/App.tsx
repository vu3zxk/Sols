import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, logoutUser, auth } from './lib/firebase';
import { 
  AppUser, 
  NavigationTab, 
  UserReflection, 
  MoodLog, 
  MonthlyPlan, 
  Habit, 
  BucketItem, 
  UserSettings 
} from './types';
import { Header } from './components/Header';
import { AuthLanding } from './components/AuthLanding';
import { MainDashboard } from './components/MainDashboard';
import { Dashboard as JournalDashboard } from './components/Dashboard';
import { MonthlyGoalsView } from './components/MonthlyGoalsView';
import { HabitTrackerView } from './components/HabitTrackerView';
import { BucketListView } from './components/BucketListView';
import { MonthReviewView } from './components/MonthReviewView';
import { SettingsView } from './components/SettingsView';
import { EveningMoodModal } from './components/EveningMoodModal';
import { 
  subscribeToUserReflections, 
  subscribeToUserMoodLogs, 
  saveUserMoodLog,
  deleteUserMoodLog,
  subscribeToMonthlyPlan,
  saveMonthlyPlan,
  subscribeToUserHabits,
  saveUserHabit,
  deleteUserHabit,
  subscribeToBucketItems,
  saveBucketItem,
  deleteBucketItem,
  fetchUserSettings,
  saveUserSettings,
} from './lib/db';
import { getTodayLocalDateKey, formatLocalDateKey } from './lib/dateUtils';
import { Sparkles, Sun } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedReflectionId, setSelectedReflectionId] = useState<string | null>(null);
  const [initialJournalPrompt, setInitialJournalPrompt] = useState<string | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('sols_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // User database states
  const [reflections, setReflections] = useState<UserReflection[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Evening Mood Check-In Modal
  const [showMoodModal, setShowMoodModal] = useState<boolean>(false);
  const [moodModalTargetDate, setMoodModalTargetDate] = useState<string | null>(null);
  const [hasPromptedEveningAuto, setHasPromptedEveningAuto] = useState<boolean>(false);

  // Apply dark mode class to root HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sols_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sols_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('sols_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sols_theme', 'light');
      }
      if (currentUser?.uid) {
        saveUserSettings(currentUser.uid, { theme: next ? 'dark' : 'light' }).catch(() => {});
      }
      return next;
    });
  }, [currentUser?.uid]);

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
        };
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions when user is signed in
  useEffect(() => {
    if (!currentUser?.uid) {
      setReflections([]);
      setMoodLogs([]);
      setMonthlyPlan(null);
      setHabits([]);
      setBucketItems([]);
      setUserSettings(null);
      return;
    }

    const uid = currentUser.uid;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Subscriptions
    const unsubReflections = subscribeToUserReflections(uid, (items) => setReflections(items));
    const unsubMoodLogs = subscribeToUserMoodLogs(uid, (items) => setMoodLogs(items));
    const unsubPlan = subscribeToMonthlyPlan(uid, currentMonthKey, (plan) => setMonthlyPlan(plan));
    const unsubHabits = subscribeToUserHabits(uid, (items) => setHabits(items));
    const unsubBucket = subscribeToBucketItems(uid, (items) => setBucketItems(items));

    // Fetch user settings
    fetchUserSettings(uid).then((settings) => {
      if (settings) {
        setUserSettings(settings);
        if (settings.theme) {
          setIsDark(settings.theme === 'dark');
        }
      }
    });

    return () => {
      unsubReflections();
      unsubMoodLogs();
      unsubPlan();
      unsubHabits();
      unsubBucket();
    };
  }, [currentUser?.uid]);

  // Check evening time for automatic mood prompt ("how are you feeling today")
  useEffect(() => {
    if (!currentUser?.uid || hasPromptedEveningAuto) return;

    const currentHour = new Date().getHours();
    const todayStr = getTodayLocalDateKey();
    const todayMood = moodLogs.find((m) => formatLocalDateKey(m.date) === todayStr);

    // Evening / End of Day is 6:00 PM (18:00) or later
    const isEvening = currentHour >= 18;
    const eveningPromptEnabled = userSettings?.eveningCheckinEnabled ?? true;

    if (isEvening && !todayMood && eveningPromptEnabled) {
      setMoodModalTargetDate(todayStr);
      setShowMoodModal(true);
      setHasPromptedEveningAuto(true);
    }
  }, [currentUser?.uid, moodLogs, hasPromptedEveningAuto, userSettings]);

  // Sign out handler
  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, []);

  // Open mood check in modal for a specific day (or today)
  const handleOpenMoodCheckIn = (targetDate?: string) => {
    setMoodModalTargetDate(targetDate || getTodayLocalDateKey());
    setShowMoodModal(true);
  };

  // Save mood handler
  const handleSaveMood = async (moodData: Omit<MoodLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser?.uid) return;
    await saveUserMoodLog(currentUser.uid, moodData);
  };

  // Delete mood handler
  const handleDeleteMood = async (moodId: string) => {
    if (!currentUser?.uid) return;
    await deleteUserMoodLog(currentUser.uid, moodId);
  };

  // Open journal with prompt
  const handleOpenNewJournal = (prompt?: string) => {
    if (prompt) setInitialJournalPrompt(prompt);
    setSelectedReflectionId(null);
    setActiveTab('journal');
  };

  // Toggle habit for today
  const handleToggleHabitToday = async (habit: Habit) => {
    if (!currentUser?.uid) return;
    const todayKey = getTodayLocalDateKey();
    const dates = habit.completedDates || [];
    const exists = dates.some((d) => formatLocalDateKey(d) === todayKey);
    const nextDates = exists
      ? dates.filter((d) => formatLocalDateKey(d) !== todayKey)
      : [...dates, todayKey];
    await saveUserHabit(currentUser.uid, {
      ...habit,
      completedDates: nextDates,
    });
  };

  // Toggle monthly todo item
  const handleToggleMonthlyTodo = async (todoId: string) => {
    if (!currentUser?.uid || !monthlyPlan) return;
    const updatedTodos = (monthlyPlan.todos || []).map((t) => {
      if (t.id === todoId) {
        return { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined };
      }
      return t;
    });
    await saveMonthlyPlan(currentUser.uid, {
      monthKey: monthlyPlan.monthKey,
      todos: updatedTodos,
    });
  };

  // Update settings handler
  const handleUpdateSettings = async (newPrefs: Partial<UserSettings>) => {
    if (!currentUser?.uid) return;
    await saveUserSettings(currentUser.uid, newPrefs);
    const updated = await fetchUserSettings(currentUser.uid);
    if (updated) setUserSettings(updated);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-stone-900 dark:bg-amber-400 text-amber-300 dark:text-stone-950 flex items-center justify-center animate-pulse">
            <Sun className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Initializing Sols Vault...
          </span>
        </div>
      </div>
    );
  }

  const todayStr = getTodayLocalDateKey();
  const effectiveModalDate = moodModalTargetDate || todayStr;
  const existingModalMood = moodLogs.find((m) => formatLocalDateKey(m.date) === effectiveModalDate);

  return (
    <div className={`w-screen ${currentUser ? 'h-screen overflow-hidden bg-stone-100 dark:bg-stone-950' : 'min-h-screen overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950'} flex flex-col font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-100 dark:selection:bg-amber-900/60 selection:text-amber-900 dark:selection:text-amber-200`}>
      <Header
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      {currentUser ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === 'dashboard' && (
            <MainDashboard
              reflections={reflections}
              moodLogs={moodLogs}
              monthlyPlan={monthlyPlan}
              habits={habits}
              bucketItems={bucketItems}
              onNavigateTab={setActiveTab}
              onOpenNewJournal={handleOpenNewJournal}
              onSelectReflection={(id) => {
                setSelectedReflectionId(id);
                setActiveTab('journal');
              }}
              onOpenMoodCheckIn={handleOpenMoodCheckIn}
              onToggleHabitToday={handleToggleHabitToday}
              onToggleMonthlyTodo={handleToggleMonthlyTodo}
            />
          )}

          {activeTab === 'journal' && (
            <JournalDashboard
              user={currentUser}
              selectedReflectionId={selectedReflectionId}
              initialPrompt={initialJournalPrompt}
              onClearInitialPrompt={() => setInitialJournalPrompt(null)}
            />
          )}

          {activeTab === 'goals' && (
            <MonthlyGoalsView
              userId={currentUser.uid}
              plan={monthlyPlan}
              onSavePlan={async (planUpdate) => {
                if (currentUser.uid) {
                  await saveMonthlyPlan(currentUser.uid, planUpdate);
                }
              }}
            />
          )}

          {activeTab === 'habits' && (
            <HabitTrackerView
              habits={habits}
              onSaveHabit={async (habit) => {
                if (currentUser.uid) await saveUserHabit(currentUser.uid, habit);
              }}
              onDeleteHabit={async (id) => {
                if (currentUser.uid) await deleteUserHabit(currentUser.uid, id);
              }}
              userId={currentUser.uid}
            />
          )}

          {activeTab === 'bucket' && (
            <BucketListView
              items={bucketItems}
              onSaveItem={async (item) => {
                if (currentUser.uid) await saveBucketItem(currentUser.uid, item);
              }}
              onDeleteItem={async (id) => {
                if (currentUser.uid) await deleteBucketItem(currentUser.uid, id);
              }}
              userId={currentUser.uid}
            />
          )}

          {activeTab === 'month-review' && (
            <MonthReviewView
              moodLogs={moodLogs}
              reflections={reflections}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userId={currentUser.uid}
              settings={userSettings}
              onUpdateSettings={handleUpdateSettings}
              reflections={reflections}
              moodLogs={moodLogs}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
            />
          )}

          {/* Evening Mood Modal Prompt */}
          <EveningMoodModal
            isOpen={showMoodModal}
            onClose={() => {
              setShowMoodModal(false);
              setMoodModalTargetDate(null);
            }}
            onSaveMood={handleSaveMood}
            onDeleteMood={handleDeleteMood}
            targetDate={effectiveModalDate}
            existingTodayMood={existingModalMood}
            isEveningPrompt={new Date().getHours() >= 18}
          />
        </div>
      ) : (
        <AuthLanding />
      )}
    </div>
  );
}
