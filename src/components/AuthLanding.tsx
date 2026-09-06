import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  MessageSquare, 
  AlertCircle, 
  Shield, 
  ArrowRight, 
  Send, 
  Clock, 
  Pin, 
  BookOpen, 
  CheckCircle2, 
  RefreshCw,
  Compass,
  Heart
} from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface AuthLandingProps {
  onSuccess?: () => void;
}

interface SamplePrompt {
  id: string;
  tag: string;
  tagColor: string;
  prompt: string;
  response: string;
  followUp: string;
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'pacing',
    tag: 'Mindful Pacing',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200/70',
    prompt: "I feel like I'm constantly rushing through everything lately, even when there's no deadline.",
    response: "That urgency often sneaks in when we measure our worth by throughput rather than presence. Notice where in your body that sensation of rushing lives right now.",
    followUp: "If you slowed down the very next task today by just ten percent, what fear or resistance surfaces?"
  },
  {
    id: 'decision',
    tag: 'Decision Clarity',
    tagColor: 'bg-indigo-50 text-indigo-800 border-indigo-200/70',
    prompt: "How do I untangle feeling overwhelmed by two conflicting career paths?",
    response: "When two paths pull equally, it usually means both represent core values you care about—perhaps security on one side and creative autonomy on the other.",
    followUp: "Which path would you choose if you knew you could not fail, and what does that reveal about your true underlying priority?"
  },
  {
    id: 'gratitude',
    tag: 'Quiet Moments',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    prompt: "A quiet win from this morning that I don't want to forget in the noise.",
    response: "Preserving small moments of calm anchors your memory far deeper than major milestones. Naming the sensory details makes it durable.",
    followUp: "What specific sound, sight, or sensation in that moment brought you that sense of groundedness?"
  }
];

export const AuthLanding: React.FC<AuthLandingProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive Teaser State
  const [activeSample, setActiveSample] = useState<SamplePrompt>(SAMPLE_PROMPTS[0]);
  const [customDraft, setCustomDraft] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [teaserTurn, setTeaserTurn] = useState<{ prompt: string; response: string; followUp: string }>({
    prompt: SAMPLE_PROMPTS[0].prompt,
    response: SAMPLE_PROMPTS[0].response,
    followUp: SAMPLE_PROMPTS[0].followUp,
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError("Sign-in was closed before completing. Click below whenever you are ready to continue.");
        console.info("Sign-in popup closed by user.");
      } else {
        console.error("Sign in failed:", err);
        let msg = "Could not complete Google Sign-In. Please try again.";
        if (err?.code === 'auth/popup-blocked') {
          msg = "Browser blocked the authentication popup. Please allow popups for this site or open in a new tab.";
        } else if (err?.code === 'auth/unauthorized-domain') {
          msg = "This domain is waiting for Firebase authorization. Please verify authorized domains.";
        } else if (err?.message) {
          msg = err.message;
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: SamplePrompt) => {
    setActiveSample(sample);
    setIsSimulating(true);
    setTimeout(() => {
      setTeaserTurn({
        prompt: sample.prompt,
        response: sample.response,
        followUp: sample.followUp
      });
      setIsSimulating(false);
    }, 280);
  };

  const handleSubmitCustomDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDraft.trim()) return;

    setIsSimulating(true);
    const submitted = customDraft.trim();
    setCustomDraft('');

    setTimeout(() => {
      setTeaserTurn({
        prompt: submitted,
        response: `Reflecting on "${submitted.length > 40 ? submitted.slice(0, 40) + '...' : submitted}": Taking the step to put your thoughts into words creates distance between experiencing an emotion and understanding it.`,
        followUp: "What is the most honest truth sitting beneath this thought that you haven't spoken out loud yet?"
      });
      setIsSimulating(false);
    }, 450);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#FDFBF7] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden flex flex-col justify-start transition-colors duration-300">
      {/* 1. Atmospheric Ambient Background Aura (Soft Warm Glows) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[550px] bg-radial from-amber-200/35 dark:from-amber-600/15 via-orange-100/20 dark:via-orange-700/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[25%] left-[-10%] w-[500px] h-[500px] bg-radial from-stone-200/40 dark:from-stone-800/30 via-amber-100/20 dark:via-amber-800/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-radial from-indigo-100/25 dark:from-indigo-900/15 via-amber-100/15 dark:via-amber-900/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container - Free Breathing Layout with Generous Vertical Spacing */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col items-center">
        
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50/90 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/70 text-amber-900 dark:text-amber-300 text-xs font-medium tracking-wide shadow-2xs mb-8 transition-all hover:bg-amber-100/80 dark:hover:bg-amber-900/40">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span>Socratic Gemini Journaling &bull; Cloud Firestore</span>
        </div>

        {/* 4. Serif Literary Hero Headline & Subheadline */}
        <div className="max-w-3xl text-center space-y-5">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-stone-900 dark:text-white leading-[1.12]">
            A quiet space for your thoughts.
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed font-sans max-w-2xl mx-auto font-normal">
            Sols is a mindful personal journal and daily mood tracker that uses Gemini to listen deeply, ask contemplative questions, and help you untangle your day.
          </p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mt-8 max-w-md w-full p-4 bg-red-50/90 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-left flex items-start gap-3 text-sm text-red-900 dark:text-red-200 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Sign-in Notice</div>
              <div className="text-red-700 dark:text-red-300 mt-0.5 text-xs sm:text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* 4. Primary CTA & Trust Badges */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            id="btn-google-signin"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-medium text-base hover:bg-stone-800 dark:hover:bg-white active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? "Opening secure session..." : "Continue with Google"}</span>
          </button>
        </div>

        {/* Inline Trust & Privacy Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-stone-700 dark:text-stone-300">Encrypted Firestore</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
            <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="font-medium text-stone-700 dark:text-stone-300">Owner-Isolated Security Rules</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span className="font-medium text-stone-700 dark:text-stone-300">No Ads &bull; Zero Public Sharing</span>
          </div>
        </div>

        {/* 2. Interactive "Product Teaser" & Live Workspace Preview Frame */}
        <section className="mt-16 w-full max-w-4xl">
          {/* Section Header */}
          <div className="text-center mb-6 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800/90 dark:text-amber-400 flex items-center justify-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Interactive Reflection Preview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-800 dark:text-white">
              Experience the dialogue before you begin
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              Select a sample prompt below or write your own thought to see how Gemini provides calm, Socratic perspective.
            </p>
          </div>

          {/* Prompt Selection Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {SAMPLE_PROMPTS.map((sample) => {
              const isSelected = activeSample.id === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected 
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 border-stone-900 dark:border-stone-100 shadow-xs' 
                      : 'bg-white/80 dark:bg-stone-900/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-stone-400 dark:bg-stone-600'}`} />
                  <span>{sample.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Workspace Mockup Card (With warm ambient aura) */}
          <div className="relative group">
            {/* Ambient Aura Glow under Card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-200/40 dark:from-amber-600/20 via-orange-100/30 dark:via-orange-600/10 to-indigo-100/40 dark:to-indigo-900/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-700 -z-10" />

            <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Mockup Window Topbar */}
              <div className="px-4 py-3 bg-stone-100/80 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                  <span className="ml-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                    Sols Workspace Preview
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/70 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Gemini 3.6 Flash Active</span>
                </div>
              </div>

              {/* Mockup Workspace Body */}
              <div className="p-5 sm:p-7 space-y-6">
                {/* Dialogue Turn: User Note */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                    You
                  </div>
                  <div className="flex-1 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs text-stone-400 dark:text-stone-500">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">Journal Entry</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Just now</span>
                    </div>
                    <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed italic font-serif">
                      "{teaserTurn.prompt}"
                    </p>
                  </div>
                </div>

                {/* Dialogue Turn: Gemini Companion Reflection */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-amber-400 text-amber-300 dark:text-stone-950 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className={`flex-1 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl p-4 sm:p-5 shadow-2xs transition-opacity duration-300 ${isSimulating ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                      <span className="font-semibold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Gemini Reflection
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 text-[11px] font-medium">
                        Socratic Guidance
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed">
                      {teaserTurn.response}
                    </p>

                    {/* Follow-up question box */}
                    <div className="mt-4 pt-3.5 border-t border-amber-200/60 dark:border-amber-900/40 bg-amber-100/40 dark:bg-amber-950/60 -mx-2 -mb-2 px-4 py-3 rounded-xl">
                      <div className="text-xs font-semibold text-amber-950 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        Deepening Inquiry:
                      </div>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-serif italic">
                        {teaserTurn.followUp}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Custom Thought Draft Input */}
                <form onSubmit={handleSubmitCustomDraft} className="pt-2">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      placeholder="Try typing your own thought (e.g. What is draining your energy today?)..."
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 rounded-xl pl-4 pr-24 py-3.5 text-xs sm:text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={!customDraft.trim() || isSimulating}
                      className="absolute right-2 px-3.5 py-2 rounded-lg bg-stone-900 dark:bg-amber-400 hover:bg-stone-800 dark:hover:bg-amber-300 text-stone-100 dark:text-stone-950 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-30 cursor-pointer"
                    >
                      <span>Reflect</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>

                {/* Sub-card CTA to continue */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Ready to keep your personal journal?
                  </span>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="text-stone-900 dark:text-amber-400 font-semibold hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 transition underline underline-offset-4 cursor-pointer"
                  >
                    <span>Save your entries securely in Firestore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Feature Cards Enhancement (Hover Lift + Brand Highlights) */}
        <section className="mt-20 w-full max-w-5xl">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-white">
              Designed for intentional clarity
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
              Everything in Sols is tailored to give you space to think without distraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group p-6 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-300/80 dark:hover:border-amber-600/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Lock className="w-5 h-5 text-amber-800 dark:text-amber-400" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 mb-2">
                Owner Bound
              </div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1.5">
                Zero-Leak Firestore Rules
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                Every reflection is stored under your user ID with owner-bound rules (<code className="text-[11px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-stone-700 dark:text-stone-300">request.auth.uid == userId</code>). No other user or third party can ever view your entries.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group p-6 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-300/80 dark:hover:border-amber-600/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-orange-100/70 dark:bg-orange-950/60 text-orange-900 dark:text-orange-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <MessageSquare className="w-5 h-5 text-orange-800 dark:text-orange-400" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 mb-2">
                Multi-Turn Flow
              </div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1.5">
                Gentle Socratic Dialogue
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                Unlike generic AI assistants that give generic answers, Gemini acts as a thoughtful sounding board that asks open questions to help you understand yourself.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group p-6 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-300/80 dark:hover:border-amber-600/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-stone-900 dark:text-stone-100 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/70 dark:border-stone-700 mb-2">
                Automated Insights
              </div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1.5">
                Synthesis &amp; Tagging
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                Pin crucial thoughts, discover recurring emotional themes over time, and generate holistic summaries of your growth across months of journaling.
              </p>
            </div>
          </div>
        </section>

        {/* Final Bottom Call to Action */}
        <section className="mt-20 text-center pb-12">
          <div className="inline-flex flex-col items-center gap-4 p-8 rounded-3xl bg-amber-50/60 dark:bg-stone-900/90 border border-amber-200/60 dark:border-stone-800 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-white">
              Begin your private journal today
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-sm">
              Sign in with Google to start exploring your thoughts in a private, encrypted atmosphere.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-sm font-medium transition shadow-xs cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};
