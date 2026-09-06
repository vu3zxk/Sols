import React, { useState } from 'react';
import { MoodLog } from '../types';
import { HeartHandshake, Sparkles, MessageCircle, X, ArrowRight } from 'lucide-react';
import { generateCaringCheckin } from '../lib/geminiApi';

interface CaringAlertProps {
  moodLogs: MoodLog[];
  onOpenJournalWithPrompt: (promptText: string) => void;
}

export function checkIsThreeDaysLow(moodLogs: MoodLog[]): { isLow: boolean; lowLogs: MoodLog[] } {
  if (!moodLogs || moodLogs.length < 3) return { isLow: false, lowLogs: [] };

  // Sort by date descending
  const sorted = [...moodLogs].sort((a, b) => b.date.localeCompare(a.date));
  const recent3 = sorted.slice(0, 3);

  // Check if all 3 recent have score <= 2
  const allThreeLow = recent3.length === 3 && recent3.every((log) => log.score <= 2);
  return { isLow: allThreeLow, lowLogs: recent3 };
}

export const CaringAlert: React.FC<CaringAlertProps> = ({ moodLogs, onOpenJournalWithPrompt }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [caringMessage, setCaringMessage] = useState<string | null>(null);

  const { isLow, lowLogs } = checkIsThreeDaysLow(moodLogs);

  if (!isLow || isDismissed) return null;

  const handleFetchGentlePrompt = async () => {
    setIsGenerating(true);
    try {
      const res = await generateCaringCheckin(lowLogs);
      setCaringMessage(res.message);
    } catch (e) {
      console.warn("Failed to generate caring checkin:", e);
      setCaringMessage(
        "Take a gentle breath. We noticed things have felt heavy these past few days. What is the matter, and what's weighing on your heart right now? Let's unpack it together safely."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartReflecting = () => {
    const prompt = caringMessage || 
      "I've been feeling down and drained for the past few days. I'd like to gently talk through what's going on and explore why I feel this way without judging myself.";
    onOpenJournalWithPrompt(prompt);
  };

  return (
    <div 
      id="caring-alert-banner"
      className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-rose-50 via-amber-50 to-orange-50 dark:from-rose-950/30 dark:via-amber-950/20 dark:to-stone-900 border border-rose-200/80 dark:border-rose-900/60 shadow-sm relative overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
        aria-label="Dismiss gentle check-in"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <HeartHandshake className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Compassionate Check-In
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 font-medium">
              3 Low Sols Noticed
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white">
            What is the matter? We noticed you've been feeling down.
          </h4>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
            {caringMessage || 
              "You've recorded low emotional valence for three days in a row. It is completely okay to not be okay. Why are you feeling down? Give yourself permission to express what is on your mind."}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleStartReflecting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Talk & Unpack in Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {!caringMessage && (
              <button
                type="button"
                onClick={handleFetchGentlePrompt}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isGenerating ? "Gathering warmth..." : "Gentle Gemini Check-In"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
