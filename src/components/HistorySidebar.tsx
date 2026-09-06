import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Clock, 
  MessageSquare, 
  BookOpen,
  Pin
} from 'lucide-react';
import { UserReflection } from '../types';

interface HistorySidebarProps {
  reflections: UserReflection[];
  activeId: string | null;
  onSelectReflection: (id: string) => void;
  onNewReflection: () => void;
  onDeleteReflection: (id: string) => void;
  onTogglePinReflection: (id: string) => void;
  isLoading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  reflections,
  activeId,
  onSelectReflection,
  onNewReflection,
  onDeleteReflection,
  onTogglePinReflection,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter reflections by title, initial content, or tags
  const filteredReflections = reflections.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.initialContent.toLowerCase().includes(q) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  // Sort pinned reflections to the top, then by most recently updated
  const sortedReflections = [...filteredReflections].sort((a, b) => {
    const aPinned = Boolean(a.isPinned);
    const bPinned = Boolean(b.isPinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70 flex flex-col h-56 lg:h-full shrink-0 min-h-0 overflow-hidden">
      {/* Top Action & Search */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 space-y-3 shrink-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs">
        <button
          id="btn-new-reflection"
          type="button"
          onClick={onNewReflection}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 text-sm font-medium hover:bg-stone-800 dark:hover:bg-amber-300 transition active:scale-[0.99] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="input-search-history"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Reflections List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-stone-400 animate-pulse">
            Loading your Firestore reflections...
          </div>
        ) : sortedReflections.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-stone-600 dark:text-stone-300">No reflections found</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              {searchQuery ? "Try a different search keyword" : "Start your first reflection with Gemini"}
            </p>
          </div>
        ) : (
          sortedReflections.map((item) => {
            const isActive = item.id === activeId;
            const msgCount = item.messages ? item.messages.length : 0;
            const isPinned = Boolean(item.isPinned);

            return (
              <div
                key={item.id}
                id={`reflection-card-${item.id}`}
                onClick={() => onSelectReflection(item.id)}
                className={`group relative p-3 rounded-2xl cursor-pointer transition-all border text-left ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 border-amber-500/70 dark:border-amber-400 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-white/80 dark:bg-stone-850 hover:bg-white dark:hover:bg-stone-800 border-stone-200/80 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isPinned && (
                      <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500 shrink-0 rotate-45" />
                    )}
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                      {item.title || "Untitled"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.updatedAt || item.createdAt)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-snug">
                  {item.initialContent || (item.messages && item.messages[0]?.content) || "No preview text"}
                </p>

                {/* Footer info, Pin & Delete Action Buttons */}
                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{msgCount}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Delete Confirmation / Trigger */}
                    {deleteConfirmId === item.id ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteReflection(item.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 bg-red-600 text-white rounded font-medium hover:bg-red-700 text-[10px]"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 transition-opacity rounded hover:bg-stone-100 dark:hover:bg-stone-700"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Pin / Unpin Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePinReflection(item.id);
                      }}
                      className={`p-1 transition-opacity rounded hover:bg-stone-100 dark:hover:bg-stone-700 ${
                        isPinned 
                          ? 'opacity-100 text-amber-600 dark:text-amber-400' 
                          : 'opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                      title={isPinned ? "Unpin note" : "Pin note to top"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500 rotate-45' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
