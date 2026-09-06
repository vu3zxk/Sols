import { ChatMessage, ReflectionMode, MonthlyTodoItem } from "../types";

export interface ReflectResponse {
  reply: string;
  modelUsed: string;
  timestamp: string;
}

export interface SummarizeResponse {
  summary: string;
  modelUsed: string;
  timestamp: string;
}

export async function askGeminiReflection(
  messages: ChatMessage[],
  mode: ReflectionMode,
  reflectionContext?: string
): Promise<ReflectResponse> {
  const response = await fetch("/api/gemini/reflect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      mode,
      reflectionContext,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Gemini API request failed with HTTP ${response.status}`
    );
  }

  return response.json();
}

export async function askGeminiSummary(
  title: string,
  content: string,
  entries: ChatMessage[]
): Promise<SummarizeResponse> {
  const response = await fetch("/api/gemini/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      content,
      entries,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Summary request failed with HTTP ${response.status}`
    );
  }

  return response.json();
}

export async function convertGoalsToTodos(
  plansRaw: string,
  monthKey: string
): Promise<{ todos: MonthlyTodoItem[]; modelUsed: string }> {
  const response = await fetch("/api/gemini/goals-to-todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plansRaw, monthKey }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Goal conversion failed: ${response.status}`);
  }

  return response.json();
}

export interface MonthReviewPayload {
  monthName: string;
  highestDay: any;
  lowestDay: any;
  avgMood: number;
  totalMoodLogs: number;
  journalHighlights: Array<{ date: string; title: string; snippet: string }>;
  initialGoals: string;
  todosCompleted: number;
  todosTotal: number;
}

export async function generateMonthReview(
  payload: MonthReviewPayload
): Promise<{ review: string; modelUsed: string }> {
  const response = await fetch("/api/gemini/month-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Month review failed: ${response.status}`);
  }

  return response.json();
}

export async function generateCaringCheckin(
  recentMoods: any[]
): Promise<{ message: string; modelUsed: string }> {
  const response = await fetch("/api/gemini/caring-checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recentMoods }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Check-in request failed: ${response.status}`);
  }

  return response.json();
}
