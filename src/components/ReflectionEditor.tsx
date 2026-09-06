import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Tags,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { UserReflection, ChatMessage, SaveState } from '../types';
import { MessageItem } from './MessageItem';
import { askGeminiReflection, askGeminiSummary } from '../lib/geminiApi';
import { getCurrentGeoLocation, getReadableLocationName } from '../lib/geo';

interface ReflectionEditorProps {
  reflection: UserReflection;
  onChange: (updated: UserReflection) => void;
  onSaveNow: () => Promise<void>;
  saveState: SaveState;
  userId: string;
  promptSetIndex?: number;
}

const PROMPT_SETS = [
  [
    "What is one decision I'm wrestling with right now and what is holding me back?",
    "What gave me unexpected energy today, and what drained it?",
    "Let's brainstorm 3 creative angles to resolve an ongoing blocker.",
    "Unpack a conversation where I felt misunderstood and help me reflect on my response.",
  ],
  [
    "What is a fear or hesitation I haven't acknowledged out loud yet this week?",
    "If I had complete confidence, what single step would I take next?",
    "What boundaries do I need to establish or protect right now?",
    "Help me reflect on a habit I want to evolve and why it feels challenging.",
  ],
  [
    "What is something small that went surprisingly well today that I didn't celebrate?",
    "Help me organize my current swirling thoughts into 3 clear focal areas.",
    "What unexamined assumption might I be holding in a current situation?",
    "How can I approach tomorrow with more calm, focus, and intentionality?",
  ],
  [
    "What am I quietly resisting right now, and what would happen if I leaned into it?",
    "Help me reframe an unexpected setback into a constructive learning moment.",
    "What core values do I want to anchor my upcoming choices around?",
    "What would my future, wiser self advise me regarding my current crossroads?",
  ],
];

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  reflection,
  onChange,
  onSaveNow,
  saveState,
  userId,
  promptSetIndex = 0,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-fetch and attach geo-tag to new reflection if missing
  useEffect(() => {
    if (!reflection.geoLocation) {
      getCurrentGeoLocation().then((loc) => {
        if (loc) {
          onChange({
            ...reflection,
            geoLocation: loc,
          });
        }
      });
    }
  }, [reflection.id]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reflection.messages, isGenerating]);

  // Scroll to Top action
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to Bottom action
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...reflection,
      title: e.target.value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleInitialContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...reflection,
      initialContent: e.target.value,
      updatedAt: new Date().toISOString(),
    });
  };

  // Send turn to Gemini
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isGenerating) return;

    setErrorMessage(null);
    const userMsgId = `msg-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...reflection.messages, newUserMsg];

    // Optimistically update reflection
    const isDefaultTitle = reflection.title === "Untitled" || reflection.title === "Untitled Reflection";
    const updatedReflection: UserReflection = {
      ...reflection,
      title: isDefaultTitle && textToSend.length > 5 
        ? textToSend.slice(0, 36) + "..."
        : reflection.title,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    onChange(updatedReflection);
    if (!customPrompt) setInputText('');
    setIsGenerating(true);

    try {
      const response = await askGeminiReflection(
        updatedMessages,
        reflection.mode,
        reflection.initialContent
      );

      const assistantMsg: ChatMessage = {
        id: `gemini-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        modelUsed: response.modelUsed,
        timestamp: response.timestamp || new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      onChange({
        ...updatedReflection,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Gemini reflection failed:", err);
      setErrorMessage(err.message || "Failed to generate reflection from Gemini. Please check connection and retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate AI Summary & Key Takeaways
  const handleGenerateSummary = async () => {
    if (isSummarizing) return;
    setErrorMessage(null);
    setIsSummarizing(true);

    try {
      const result = await askGeminiSummary(
        reflection.title,
        reflection.initialContent,
        reflection.messages
      );

      // Extract potential tags from summary if present
      let extractedTags: string[] = reflection.tags || [];
      const tagsMatch = result.summary.match(/(?:Tags|Themes):\s*([^\n]+)/i);
      if (tagsMatch && tagsMatch[1]) {
        const foundTags = tagsMatch[1]
          .split(',')
          .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
          .filter((t) => t.length > 1 && t.length < 25);
        if (foundTags.length > 0) {
          extractedTags = Array.from(new Set([...extractedTags, ...foundTags]));
        }
      }

      onChange({
        ...reflection,
        aiSummary: result.summary,
        tags: extractedTags,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Summary generation failed:", err);
      setErrorMessage(err.message || "Failed to generate summary. Please retry.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full bg-white dark:bg-stone-900 overflow-hidden">
      {/* Top Toolbar & Metadata */}
      <div className="shrink-0 p-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title Input */}
        <div className="flex-1 min-w-0">
          <input
            id="input-reflection-title"
            type="text"
            value={reflection.title}
            onChange={handleTitleChange}
            placeholder="Title of this Sol reflection..."
            className="w-full text-base sm:text-lg font-bold text-stone-900 dark:text-white bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 focus:outline-none transition py-0.5"
          />
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            <span>Created {new Date(reflection.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {getReadableLocationName(reflection.geoLocation) && (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>{getReadableLocationName(reflection.geoLocation)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Persistence status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            {saveState === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-stone-600 dark:text-stone-300 text-[11px]">Syncing..</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-stone-700 dark:text-stone-300 text-[11px]">Saved</span>
              </>
            )}
            {saveState === 'error' && (
              <button
                type="button"
                onClick={() => onSaveNow()}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-[11px] font-semibold"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Retry Save</span>
              </button>
            )}
            {saveState === 'idle' && (
              <span className="text-stone-400 text-[11px]">Synced</span>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center justify-between text-xs text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSendMessage()}
            className="px-2.5 py-1 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition"
          >
            Retry Call
          </button>
        </div>
      )}

      {/* Main Workspace Area (Scrollable) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6"
      >
        {/* Primary Journal Input & Starters */}
        <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-4 sm:p-5 space-y-4">
          {/* Initial Journal Entry Box */}
          <div className="space-y-3">
            <textarea
              id="textarea-initial-entry"
              rows={4}
              value={reflection.initialContent}
              onChange={handleInitialContentChange}
              placeholder="What is on your mind today? Write freely about your feelings, experiences, challenges, or insights..."
              className="w-full p-4 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-y leading-relaxed shadow-2xs"
            />

            {/* Below Text Box: Reflect Action */}
            {reflection.messages.length === 0 && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {reflection.initialContent.trim().length > 0
                    ? `${reflection.initialContent.trim().split(/\s+/).length} words`
                    : 'Write your thoughts or select a starter prompt below'}
                </span>
                <button
                  id="btn-submit-reflection"
                  type="button"
                  onClick={() => handleSendMessage(reflection.initialContent)}
                  disabled={isGenerating || !reflection.initialContent.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
                  <span>Reflect</span>
                </button>
              </div>
            )}
          </div>

          {/* Prompt Suggestions */}
          {reflection.messages.length === 0 && (
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/50">
              <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Need inspiration? Tap a starter prompt:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SETS[promptSetIndex % PROMPT_SETS.length].map((prompt, idx) => (
                  <button
                    key={`${promptSetIndex}-${idx}`}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-stone-700 dark:text-stone-300 px-3.5 py-2 rounded-xl transition hover:shadow-2xs leading-snug"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Summary / Insights Card (if generated) */}
        {reflection.aiSummary && (
          <div className="bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200/80 dark:border-stone-700 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-stone-900 dark:text-white">AI Synthesis &amp; Key Takeaways</h4>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="text-xs text-amber-900 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />
                <span>Re-summarize</span>
              </button>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 text-xs sm:text-sm">
              <Markdown>{reflection.aiSummary}</Markdown>
            </div>

            {reflection.tags && reflection.tags.length > 0 && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-stone-700 flex flex-wrap items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                {reflection.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[11px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Dialogue Thread */}
        <div className="space-y-4">
          {reflection.messages.length > 0 && !reflection.aiSummary && (
            <div className="flex items-center justify-end pb-1 border-b border-stone-100 dark:border-stone-800">
              <button
                id="btn-generate-summary"
                type="button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200/80 border border-amber-200 dark:border-amber-800 rounded-xl transition disabled:opacity-50 shadow-2xs"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-700 dark:text-amber-400 ${isSummarizing ? 'animate-spin' : ''}`} />
                <span>{isSummarizing ? 'Synthesizing...' : 'Summarize Entry'}</span>
              </button>
            </div>
          )}

          {reflection.messages.length === 0 ? (
            <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">
              Type your thoughts below or select a prompt to begin conversing with Gemini.
            </div>
          ) : (
            reflection.messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))
          )}

          {isGenerating && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 text-xs text-stone-500 dark:text-stone-400 shadow-xs flex items-center gap-2">
                <span>Gemini is synthesizing insights...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Bottom Message Input Bar */}
      <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shrink-0 shadow-xs z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-2.5"
        >
          {/* Main Input Box */}
          <div className="flex-1 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100/60 focus-within:bg-white dark:focus-within:bg-stone-800 focus-within:ring-2 focus-within:ring-amber-500/30 border border-stone-200 dark:border-stone-700 rounded-2xl transition-all p-2 flex items-end shadow-2xs">
            <textarea
              id="input-chat-message"
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Gemini to reflect, unpack an idea, or brainstorm next steps (Shift+Enter for newline)..."
              disabled={isGenerating}
              className="w-full px-2 py-1 text-sm bg-transparent border-0 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="h-[52px] w-[52px] rounded-2xl bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 font-medium hover:bg-stone-800 dark:hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-xs shrink-0 active:scale-95 mb-0.5"
            title="Send to Gemini (Enter)"
          >
            <Send className="w-4 h-4 translate-x-[-0.5px] translate-y-[-0.5px]" />
          </button>

          {/* Quick Scroll Up & Down Navigation Controls */}
          <div className="flex flex-col gap-1 mb-0.5 shrink-0">
            <button
              id="btn-scroll-top"
              type="button"
              onClick={scrollToTop}
              className="h-[24px] w-[28px] rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 transition flex items-center justify-center shadow-2xs active:scale-95"
              title="Scroll to top"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-scroll-bottom"
              type="button"
              onClick={scrollToBottom}
              className="h-[24px] w-[28px] rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 transition flex items-center justify-center shadow-2xs active:scale-95"
              title="Scroll to bottom"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
