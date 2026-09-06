import React, { useState, useEffect } from 'react';
import { MonthlyPlan, MonthlyTodoItem } from '../types';
import { convertGoalsToTodos, generateMonthReview } from '../lib/geminiApi';
import { 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  RefreshCw, 
  Calendar, 
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MonthlyGoalsViewProps {
  userId: string;
  plan: MonthlyPlan | null;
  onSavePlan: (updatedPlan: Partial<MonthlyPlan> & { monthKey: string }) => Promise<void>;
}

export const MonthlyGoalsView: React.FC<MonthlyGoalsViewProps> = ({
  userId,
  plan,
  onSavePlan,
}) => {
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const [rawGoalsInput, setRawGoalsInput] = useState(plan?.plansRaw || '');
  const [todos, setTodos] = useState<MonthlyTodoItem[]>(plan?.todos || []);
  const [endReview, setEndReview] = useState<string>(plan?.endOfMonthReview || '');

  const [isConverting, setIsConverting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if plan changes from Firebase snapshot
  useEffect(() => {
    if (plan) {
      setRawGoalsInput(plan.plansRaw || '');
      setTodos(plan.todos || []);
      setEndReview(plan.endOfMonthReview || '');
    }
  }, [plan]);

  // Convert raw text into structured todos using Gemini
  const handleConvertToTodos = async () => {
    if (!rawGoalsInput.trim()) return;
    setIsConverting(true);
    setErrorMessage(null);

    try {
      const result = await convertGoalsToTodos(rawGoalsInput, monthName);
      const newTodoList: MonthlyTodoItem[] = result.todos.map((t, idx) => ({
        id: `todo-${Date.now()}-${idx}`,
        title: t.title,
        category: t.category || 'General',
        priority: t.priority || 'medium',
        completed: false,
      }));

      setTodos(newTodoList);
      await onSavePlan({
        monthKey: currentMonthKey,
        plansRaw: rawGoalsInput,
        todos: newTodoList,
      });
    } catch (err: any) {
      console.error("Conversion error:", err);
      setErrorMessage(err.message || "Failed to convert goals. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  // Toggle todo completion
  const handleToggleTodo = async (todoId: string) => {
    const updated = todos.map((t) => {
      if (t.id === todoId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    setTodos(updated);
    await onSavePlan({
      monthKey: currentMonthKey,
      todos: updated,
    });
  };

  // Add a single custom todo
  const handleAddManualTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newItem: MonthlyTodoItem = {
      id: `todo-custom-${Date.now()}`,
      title: newTodoText.trim(),
      category: 'Focus',
      priority: 'medium',
      completed: false,
    };

    const updated = [...todos, newItem];
    setTodos(updated);
    setNewTodoText('');
    await onSavePlan({
      monthKey: currentMonthKey,
      todos: updated,
    });
  };

  // Delete a todo item
  const handleDeleteTodo = async (todoId: string) => {
    const updated = todos.filter((t) => t.id !== todoId);
    setTodos(updated);
    await onSavePlan({
      monthKey: currentMonthKey,
      todos: updated,
    });
  };

  // End of Month progress review with Gemini
  const handleGenerateEndOfMonthReview = async () => {
    setIsReviewing(true);
    setErrorMessage(null);

    const completedCount = todos.filter((t) => t.completed).length;
    try {
      const res = await generateMonthReview({
        monthName,
        highestDay: null,
        lowestDay: null,
        avgMood: 0,
        totalMoodLogs: 0,
        journalHighlights: [],
        initialGoals: rawGoalsInput,
        todosCompleted: completedCount,
        todosTotal: todos.length,
      });

      setEndReview(res.review);
      await onSavePlan({
        monthKey: currentMonthKey,
        endOfMonthReview: res.review,
      });
    } catch (err: any) {
      console.error("Review generation failed:", err);
      setErrorMessage(err.message || "Could not generate month review.");
    } finally {
      setIsReviewing(false);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-stone-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{monthName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              Monthly Intentions & To-Do List
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Begin each month with clear intentions. Sols converts your visions into actionable steps and discusses your progress at month-end.
            </p>
          </div>

          {todos.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs min-w-[200px]">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-stone-500 dark:text-stone-400">Monthly Progress</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 text-right">
                {completedCount} of {todos.length} achieved
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 rounded-2xl">
            {errorMessage}
          </div>
        )}

        {/* Section 1: Monthly Planning Prompt */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                What do you plan to achieve this month?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Write freely. Mention your main projects, health intentions, creative pursuits, or habits.
              </p>
            </div>
          </div>

          <textarea
            rows={4}
            value={rawGoalsInput}
            onChange={(e) => setRawGoalsInput(e.target.value)}
            placeholder="e.g., Launch the redesign for my project, run 3 times a week, read 2 books on psychology, practice 10 minutes of evening silence..."
            className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {todos.length > 0 ? "You can re-convert if your monthly priorities shifted." : "Gemini will break this down into clear actionable items."}
            </span>
            <button
              type="button"
              id="convert-goals-btn"
              onClick={handleConvertToTodos}
              disabled={isConverting || !rawGoalsInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
              <span>{isConverting ? "Converting with Gemini..." : "Convert to Actionable To-Do List"}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Converted Actionable To-Do List */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                Monthly Action Checklist
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Check items off as you move through your Sols this month.
              </p>
            </div>
            {todos.length > 0 && (
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {completedCount} / {todos.length} done
              </span>
            )}
          </div>

          {/* Quick Add Custom Todo */}
          <form onSubmit={handleAddManualTodo} className="flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add another specific task..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="submit"
              disabled={!newTodoText.trim()}
              className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* List items */}
          {todos.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                No to-do items yet. Enter your plans above and click "Convert to Actionable To-Do List".
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    todo.completed
                      ? 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800/40 text-stone-400 line-through'
                      : 'bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 pr-2"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400 shrink-0 hover:text-amber-500 transition-colors" />
                    )}
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {todo.title}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {todo.category && (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                        {todo.category}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-lg"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Month-End Progress Comparison & Gemini Discussion */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Month-End Calibration
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white mt-0.5">
                Compare Plans & Discuss Progress
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                At the end of each month, compare what you wrote at the start with your actual progress and unpack the journey with Gemini.
              </p>
            </div>

            <button
              type="button"
              id="discuss-progress-gemini-btn"
              onClick={handleGenerateEndOfMonthReview}
              disabled={isReviewing || todos.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>{isReviewing ? "Discussing with Gemini..." : "Discuss Progress with Gemini"}</span>
            </button>
          </div>

          {endReview ? (
            <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-stone-800/40 border border-amber-200/60 dark:border-stone-800 text-stone-800 dark:text-stone-200 prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown>{endReview}</ReactMarkdown>
            </div>
          ) : (
            <div className="py-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-400 dark:text-stone-500">
              Click "Discuss Progress with Gemini" to compare your beginning goals with current completion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
