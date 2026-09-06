import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppUser, UserReflection, SaveState } from '../types';
import { HistorySidebar } from './HistorySidebar';
import { ReflectionEditor } from './ReflectionEditor';
import { 
  subscribeToUserReflections, 
  saveUserReflection, 
  deleteUserReflection,
} from '../lib/db';
import { Sparkles, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: AppUser;
  selectedReflectionId?: string | null;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

function createNewBlankReflection(userId: string, initialContent: string = ''): UserReflection {
  const id = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    userId,
    title: initialContent ? (initialContent.slice(0, 36) + '...') : 'Untitled',
    initialContent,
    messages: [],
    tags: [],
    mode: 'reflect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
  };
}

function isBlankReflection(reflection: UserReflection | null): boolean {
  if (!reflection) return false;
  const isTitleBlank = !reflection.title || reflection.title.trim() === '' || reflection.title.trim() === 'Untitled' || reflection.title.trim() === 'Untitled Reflection';
  const isContentBlank = !reflection.initialContent || reflection.initialContent.trim() === '';
  const hasNoMessages = !reflection.messages || reflection.messages.length === 0;
  const hasNoSummary = !reflection.aiSummary;
  return isTitleBlank && isContentBlank && hasNoMessages && hasNoSummary;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  selectedReflectionId,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [reflections, setReflections] = useState<UserReflection[]>([]);
  const [activeReflection, setActiveReflection] = useState<UserReflection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [promptSetIndex, setPromptSetIndex] = useState<number>(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeReflectionRef = useRef<UserReflection | null>(null);
  activeReflectionRef.current = activeReflection;

  // Real-time listener to user's isolated Firestore collection
  useEffect(() => {
    if (!user.uid) return;
    setIsLoading(true);
    setFirestoreError(null);

    const unsubscribe = subscribeToUserReflections(
      user.uid,
      (items) => {
        setReflections(items);
        setIsLoading(false);

        // If selectedReflectionId is passed in
        if (selectedReflectionId) {
          const target = items.find((i) => i.id === selectedReflectionId);
          if (target) {
            setActiveReflection(target);
            return;
          }
        }

        // If initial prompt is passed in to start a new entry
        if (initialPrompt) {
          const blankWithPrompt = createNewBlankReflection(user.uid, initialPrompt);
          setActiveReflection(blankWithPrompt);
          persistReflection(blankWithPrompt);
          if (onClearInitialPrompt) onClearInitialPrompt();
          return;
        }

        // Default: keep current if active, else select first or blank
        setActiveReflection((current) => {
          if (current) {
            const updated = items.find((i) => i.id === current.id);
            return updated || current;
          }
          if (items.length > 0) {
            return items[0];
          }
          return createNewBlankReflection(user.uid);
        });
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        setFirestoreError(error.message || "Failed to sync with Firestore.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // If selectedReflectionId changes externally
  useEffect(() => {
    if (selectedReflectionId && reflections.length > 0) {
      const match = reflections.find((r) => r.id === selectedReflectionId);
      if (match) setActiveReflection(match);
    }
  }, [selectedReflectionId, reflections]);

  // Persist reflection to Firestore
  const persistReflection = useCallback(async (reflectionToSave: UserReflection) => {
    if (!user.uid || !reflectionToSave) return;
    try {
      setSaveState('saving');
      await saveUserReflection(user.uid, reflectionToSave);
      setSaveState('saved');
      setFirestoreError(null);
    } catch (err: any) {
      console.error("Firestore write failure:", err);
      setSaveState('error');
      setFirestoreError("Could not save to Firestore: " + (err?.message || "Unknown error"));
    }
  }, [user.uid]);

  // Handle updates from editor with debounce auto-save
  const handleReflectionChange = (updated: UserReflection) => {
    setActiveReflection(updated);
    setSaveState('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      persistReflection(updated);
    }, 1200);
  };

  const handleManualSave = async () => {
    if (activeReflection) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      await persistReflection(activeReflection);
    }
  };

  const handleNewReflection = async () => {
    // Rotate to a new prompt set on every 'new journal' click
    setPromptSetIndex((prev) => (prev + 1) % 4);

    if (activeReflection && isBlankReflection(activeReflection)) {
      if (reflections.some((r) => r.id === activeReflection.id)) {
        await deleteUserReflection(user.uid, activeReflection.id);
      }
    }
    const blank = createNewBlankReflection(user.uid);
    setActiveReflection(blank);
    persistReflection(blank);
  };

  const handleTogglePinReflection = async (id: string) => {
    const target = reflections.find((r) => r.id === id) || (activeReflection?.id === id ? activeReflection : null);
    if (!target) return;

    const newPinnedState = !target.isPinned;
    const updated: UserReflection = {
      ...target,
      isPinned: newPinnedState,
      updatedAt: new Date().toISOString(),
    };

    if (activeReflection?.id === id) {
      setActiveReflection(updated);
    }
    await persistReflection(updated);
  };

  const handleSelectReflection = async (id: string) => {
    if (activeReflection && activeReflection.id !== id && isBlankReflection(activeReflection)) {
      try {
        await deleteUserReflection(user.uid, activeReflection.id);
      } catch (e) {
        console.warn("Cleanup of blank reflection failed:", e);
      }
    }

    const found = reflections.find((r) => r.id === id);
    if (found) {
      setActiveReflection(found);
    }
  };

  const handleDeleteReflection = async (id: string) => {
    try {
      await deleteUserReflection(user.uid, id);
      if (activeReflection?.id === id) {
        const remaining = reflections.filter((r) => r.id !== id);
        if (remaining.length > 0) {
          setActiveReflection(remaining[0]);
        } else {
          const blank = createNewBlankReflection(user.uid);
          setActiveReflection(blank);
          persistReflection(blank);
        }
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      setFirestoreError("Could not delete reflection: " + (err?.message || "Error"));
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-stone-100 dark:bg-stone-950">
      {/* Sidebar for History & Selection */}
      <HistorySidebar
        reflections={reflections}
        activeId={activeReflection?.id || null}
        onSelectReflection={handleSelectReflection}
        onNewReflection={handleNewReflection}
        onDeleteReflection={handleDeleteReflection}
        onTogglePinReflection={handleTogglePinReflection}
        isLoading={isLoading}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 min-h-0 min-w-0 flex flex-col h-full overflow-hidden bg-white dark:bg-stone-900">
        {firestoreError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{firestoreError}</span>
            </div>
            <button
              type="button"
              onClick={handleManualSave}
              className="px-2 py-0.5 bg-red-700 text-white rounded font-medium hover:bg-red-800 text-[11px]"
            >
              Retry Save
            </button>
          </div>
        )}

        {activeReflection ? (
          <ReflectionEditor
            key={activeReflection.id}
            reflection={activeReflection}
            onChange={handleReflectionChange}
            onSaveNow={handleManualSave}
            saveState={saveState}
            userId={user.uid}
            promptSetIndex={promptSetIndex}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-stone-900">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mb-4">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-white">
              No Reflection Selected
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1 mb-4">
              Choose an existing reflection from the history panel or create a new journal entry to converse with Gemini.
            </p>
            <button
              type="button"
              onClick={handleNewReflection}
              className="px-4 py-2 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition"
            >
              Start New Reflection
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
