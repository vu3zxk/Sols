import React, { useState } from 'react';
import { BucketItem } from '../types';
import { 
  Compass, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Sparkles, 
  Tag,
  Check
} from 'lucide-react';

interface BucketListViewProps {
  items: BucketItem[];
  onSaveItem: (item: BucketItem) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  userId: string;
}

const CATEGORIES = ['All', 'Travel & Adventure', 'Creative & Art', 'Personal Mastery', 'Career & Impact', 'Experiences'];

export const BucketListView: React.FC<BucketListViewProps> = ({
  items,
  onSaveItem,
  onDeleteItem,
  userId,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Travel & Adventure');
  const [newTargetDate, setNewTargetDate] = useState('');

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  const completedCount = items.filter((i) => i.completed).length;

  const handleToggleComplete = async (item: BucketItem) => {
    const updated: BucketItem = {
      ...item,
      completed: !item.completed,
      completedAt: !item.completed ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    await onSaveItem(updated);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: BucketItem = {
      id: `bucket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      targetDate: newTargetDate.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveItem(newItem);
    setNewTitle('');
    setNewDesc('');
    setNewTargetDate('');
    setIsAdding(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Life Horizons</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              The Bucket List
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Honor your dreams and long-term milestones. Every Sol brings you closer to your grandest aspirations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {completedCount} of {items.length} fulfilled
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsAdding((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dream</span>
            </button>
          </div>
        </div>

        {/* Add Item Form */}
        {isAdding && (
          <form
            onSubmit={handleCreateItem}
            className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              Add a New Bucket List Aspiration
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What is your aspiration? (e.g., Witness the Northern Lights in Tromsø)..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                autoFocus
              />
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Why is this meaningful to you? What feelings or milestones are attached to it?"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="Travel & Adventure">Travel & Adventure</option>
                  <option value="Creative & Art">Creative & Art</option>
                  <option value="Personal Mastery">Personal Mastery</option>
                  <option value="Career & Impact">Career & Impact</option>
                  <option value="Experiences">Experiences</option>
                </select>
                <input
                  type="text"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  placeholder="Target timeframe (e.g. 2027, Summer, By age 30)..."
                  className="px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-5 py-2 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 disabled:opacity-40"
              >
                Save Aspiration
              </button>
            </div>
          </form>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-2xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bucket Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800">
            <Compass className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {activeCategory === 'All'
                ? "Your bucket list is empty. Click 'Add Dream' above to articulate your life aspirations."
                : `No items found in "${activeCategory}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  item.completed
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(item)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-400 shrink-0 hover:text-amber-500 transition-colors" />
                      )}
                      <h3 className={`text-sm sm:text-base font-semibold leading-snug ${item.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-white'}`}>
                        {item.title}
                      </h3>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-stone-300 hover:text-red-500 transition-colors rounded-lg"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 mb-3 pl-7.5">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/60 text-[11px] text-stone-400">
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                    {item.category}
                  </span>
                  {item.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.targetDate}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
