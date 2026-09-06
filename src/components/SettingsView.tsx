import React, { useState } from 'react';
import { UserSettings, UserReflection, MoodLog } from '../types';
import { deleteAllUserDataFromFirebase, saveUserSettings } from '../lib/db';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Download, 
  Trash2, 
  ShieldAlert, 
  Moon, 
  Sun, 
  Check, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

interface SettingsViewProps {
  userId: string;
  settings: UserSettings | null;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  reflections: UserReflection[];
  moodLogs: MoodLog[];
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userId,
  settings,
  onUpdateSettings,
  reflections,
  moodLogs,
  isDark,
  onToggleTheme,
  onLogout,
}) => {
  const [reminderEnabled, setReminderEnabled] = useState(settings?.dailyReminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(settings?.dailyReminderTime || '20:00');
  const [eveningPromptEnabled, setEveningPromptEnabled] = useState(settings?.eveningCheckinEnabled ?? true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Export state
  const [exportedMsg, setExportedMsg] = useState<string | null>(null);

  const handleSavePreferences = async () => {
    setIsSavingSettings(true);
    try {
      await onUpdateSettings({
        dailyReminderEnabled: reminderEnabled,
        dailyReminderTime: reminderTime,
        eveningCheckinEnabled: eveningPromptEnabled,
      });
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Sols Notifications Enabled', {
          body: 'You will receive gentle mindfulness reminders according to your schedule.',
        });
      }
    }
  };

  // Export all chats and reflections to Markdown
  const handleExportMarkdown = () => {
    if (reflections.length === 0) {
      setExportedMsg("No reflections to export yet.");
      setTimeout(() => setExportedMsg(null), 3000);
      return;
    }

    let md = `# Sols - Complete Mindful Journal Export\n`;
    md += `*Exported on: ${new Date().toLocaleString()}*\n`;
    md += `*Total Reflections: ${reflections.length}*\n\n`;
    md += `---\n\n`;

    reflections.forEach((ref, index) => {
      md += `## ${index + 1}. ${ref.title || 'Untitled Reflection'}\n`;
      md += `**Date:** ${new Date(ref.createdAt).toLocaleString()}\n`;
      if (ref.geoLocation?.cityOrRegion) {
        md += `**Location:** 📍 ${ref.geoLocation.cityOrRegion}\n`;
      }
      if (ref.tags && ref.tags.length > 0) {
        md += `**Themes:** ${ref.tags.join(', ')}\n`;
      }
      md += `\n### Initial Reflection:\n${ref.initialContent || '(Empty)'}\n\n`;

      if (ref.aiSummary) {
        md += `### AI Synthesis:\n${ref.aiSummary}\n\n`;
      }

      if (ref.messages && ref.messages.length > 0) {
        md += `### Dialogue with Gemini:\n`;
        ref.messages.forEach((msg) => {
          const sender = msg.role === 'assistant' ? 'Gemini' : 'You';
          md += `**${sender}** (${new Date(msg.timestamp).toLocaleTimeString()}):\n${msg.content}\n\n`;
        });
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sols-journal-export-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedMsg("Exported all journal reflections to Markdown!");
    setTimeout(() => setExportedMsg(null), 3500);
  };

  // Export all data to JSON
  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      userVault: userId,
      reflections,
      moodLogs,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sols-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedMsg("Exported complete data backup to JSON!");
    setTimeout(() => setExportedMsg(null), 3500);
  };

  // Execute hard purge
  const handleExecutePurge = async () => {
    if (confirmInput.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAllUserDataFromFirebase(userId);
      setShowDeleteModal(false);
      onLogout();
    } catch (err: any) {
      console.error("Purge error:", err);
      setDeleteError(err.message || "Failed to purge database data.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Preferences & Data Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Configure reminder times, export your full dialogue archives, manage appearance, and exercise zero-trust data control.
          </p>
        </div>

        {settingsSavedMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Preferences updated successfully.</span>
          </div>
        )}

        {/* 1. Theme & Appearance */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                Appearance & Theme
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Switch between crisp daylight neutral and mindful twilight dark mode.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold transition-colors"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-stone-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Notification Preferences */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">
              Mindfulness & Journal Notifications
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Set when Sols sends daily alerts if you haven't journaled or logged your mood.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
              <div className="pr-4">
                <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-white block">
                  Daily Journal Reminder
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Alerts you if you haven't recorded a reflection for today's Sol cycle.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
              />
            </div>

            {reminderEnabled && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-900 dark:text-white">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Preferred Reminder Time</span>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800">
              <div className="pr-4">
                <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-white block">
                  Evening Sol Check-In Prompt
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Prompts 'How are you feeling today?' when opening Sols at evening / end of day.
                </span>
              </div>
              <input
                type="checkbox"
                checked={eveningPromptEnabled}
                onChange={(e) => setEveningPromptEnabled(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRequestNotificationPermission}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Browser Push Notifications</span>
            </button>
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSavingSettings}
              className="px-5 py-2 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs"
            >
              {isSavingSettings ? "Saving..." : "Save Notification Settings"}
            </button>
          </div>
        </div>

        {/* 3. Export Chats & Journals (Moved here per request) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">
              Export Journal & Dialogue Archives
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Download your complete personal reflections, multi-turn Gemini conversations, and AI summaries for your personal archives.
            </p>
          </div>

          {exportedMsg && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-300 rounded-xl">
              {exportedMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              id="export-markdown-btn"
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>Export All as Markdown (.md)</span>
            </button>

            <button
              type="button"
              id="export-json-btn"
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Complete Vault (.json)</span>
            </button>
          </div>
        </div>

        {/* 4. Danger Zone: Delete My Data From Firebase */}
        <div className="bg-red-50/60 dark:bg-red-950/20 rounded-3xl p-6 border border-red-200/80 dark:border-red-900/40 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-red-900 dark:text-red-300">
                Purge All My Data (Firebase)
              </h2>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                Permanently purge all your data stored in Google Cloud Firestore under your isolated user account. This deletes all journal entries, chats, mood history, habits, and goals. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              id="delete-data-trigger-btn"
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            >
              Delete My Data from Firebase
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 border border-red-200 dark:border-red-900 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold">Confirm Total Data Deletion</h3>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                You are about to permanently delete your Sols Firestore database records. To prevent accidental loss, please type <span className="font-mono font-bold text-red-600">DELETE</span> in the box below to proceed.
              </p>

              {deleteError && (
                <div className="p-3 bg-red-100 text-red-800 text-xs rounded-xl">
                  {deleteError}
                </div>
              )}

              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm..."
                className="w-full px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-all-btn"
                  onClick={handleExecutePurge}
                  disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 shadow-xs"
                >
                  {isDeleting ? "Purging Vault..." : "Permanently Purge Data"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
