export type ReflectionMode = 'reflect' | 'brainstorm' | 'summary' | 'counsel';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface GeoLocationInfo {
  latitude: number;
  longitude: number;
  cityOrRegion?: string;
  accuracy?: number;
  timestamp?: string;
}

export interface UserReflection {
  id: string;
  userId: string;
  title: string;
  initialContent: string;
  messages: ChatMessage[];
  aiSummary?: string;
  tags?: string[];
  mode: ReflectionMode;
  geoLocation?: GeoLocationInfo;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isPinned?: boolean;
}

export type MoodCategory = 'great' | 'good' | 'centered' | 'low' | 'down';

export interface MoodLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: MoodCategory;
  score: number; // 1 to 5 (5 is great, 1 is down)
  energy: number; // 1 to 5
  note?: string;
  geoLocation?: GeoLocationInfo;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyTodoItem {
  id: string;
  title: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
}

export interface MonthlyPlan {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM, e.g. "2026-09"
  plansRaw: string;
  todos: MonthlyTodoItem[];
  endOfMonthReview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: string;
  completedDates: string[]; // array of YYYY-MM-DD strings
  createdAt: string;
  updatedAt: string;
}

export interface BucketItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "20:00"
  eveningCheckinEnabled: boolean;
  updatedAt: string;
}

export type SaveState = 'saved' | 'saving' | 'error' | 'idle';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type NavigationTab = 
  | 'dashboard'
  | 'journal'
  | 'goals'
  | 'habits'
  | 'bucket'
  | 'month-review'
  | 'settings';

export type ActivePage = NavigationTab;
