import React, { useState } from 'react';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      id={`message-${message.id}`}
      className={`flex gap-3.5 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
          isAssistant
            ? 'bg-stone-900 text-amber-300 shadow-xs'
            : 'bg-stone-200 text-stone-700'
        }`}
      >
        {isAssistant ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 transition-all text-sm ${
          isAssistant
            ? 'bg-white border border-stone-200 text-stone-800 shadow-xs'
            : 'bg-stone-900 text-stone-100'
        }`}
      >
        {/* Header metadata */}
        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-stone-100/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              {isAssistant ? 'Gemini Reflection' : 'You'}
            </span>
            {isAssistant && message.modelUsed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                {message.modelUsed}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span>{formattedTime}</span>
            <button
              type="button"
              onClick={handleCopy}
              className={`p-1 rounded hover:bg-stone-100 ${isAssistant ? 'text-stone-400 hover:text-stone-700' : 'text-stone-400 hover:text-white hover:bg-stone-800'}`}
              title="Copy message text"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Content Body with Markdown */}
        <div className={`prose prose-sm max-w-none ${isAssistant ? 'text-stone-800 prose-stone' : 'text-stone-100 prose-invert'}`}>
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    </div>
  );
};
