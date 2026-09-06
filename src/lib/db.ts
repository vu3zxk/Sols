import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  where
} from "firebase/firestore";
import { db, sanitizeForFirestore } from "./firebase";
import { 
  UserReflection, 
  MoodLog, 
  MonthlyPlan, 
  Habit, 
  BucketItem, 
  UserSettings 
} from "../types";

// ==========================================
// 1. REFLECTIONS (/users/{userId}/reflections)
// ==========================================
export function getReflectionsCollection(userId: string) {
  if (!userId) throw new Error("User ID is required for reflections.");
  return collection(db, "users", userId, "reflections");
}

export function getReflectionDoc(userId: string, reflectionId: string) {
  if (!userId || !reflectionId) throw new Error("User ID and Reflection ID are required.");
  return doc(db, "users", userId, "reflections", reflectionId);
}

export function subscribeToUserReflections(
  userId: string,
  onUpdate: (reflections: UserReflection[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    getReflectionsCollection(userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserReflection[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || "Untitled Reflection",
          initialContent: data.initialContent || "",
          messages: data.messages || [],
          aiSummary: data.aiSummary || "",
          tags: data.tags || [],
          mode: data.mode || "reflect",
          geoLocation: data.geoLocation,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          isFavorite: Boolean(data.isFavorite),
          isPinned: Boolean(data.isPinned),
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error("[Firestore] Reflections subscription error:", err);
      if (onError) onError(err);
    }
  );
}

export async function fetchUserReflections(userId: string): Promise<UserReflection[]> {
  if (!userId) return [];
  const q = query(getReflectionsCollection(userId), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  const items: UserReflection[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    items.push({
      id: docSnap.id,
      userId: data.userId || userId,
      title: data.title || "Untitled Reflection",
      initialContent: data.initialContent || "",
      messages: data.messages || [],
      aiSummary: data.aiSummary || "",
      tags: data.tags || [],
      mode: data.mode || "reflect",
      geoLocation: data.geoLocation,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      isFavorite: Boolean(data.isFavorite),
      isPinned: Boolean(data.isPinned),
    });
  });
  return items;
}

export async function saveUserReflection(userId: string, reflection: UserReflection): Promise<void> {
  if (!userId || !reflection.id) throw new Error("Invalid parameters to save reflection.");
  const docRef = getReflectionDoc(userId, reflection.id);
  const payload = sanitizeForFirestore({
    ...reflection,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteUserReflection(userId: string, reflectionId: string): Promise<void> {
  if (!userId || !reflectionId) return;
  const docRef = getReflectionDoc(userId, reflectionId);
  await deleteDoc(docRef);
}

// ==========================================
// 2. MOOD LOGS (/users/{userId}/mood_logs)
// ==========================================
export function getMoodLogsCollection(userId: string) {
  if (!userId) throw new Error("User ID is required for mood logs.");
  return collection(db, "users", userId, "mood_logs");
}

export function subscribeToUserMoodLogs(
  userId: string,
  onUpdate: (moodLogs: MoodLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(getMoodLogsCollection(userId), orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MoodLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          date: data.date,
          mood: data.mood || "good",
          score: typeof data.score === "number" ? data.score : 3,
          energy: typeof data.energy === "number" ? data.energy : 3,
          note: data.note || "",
          geoLocation: data.geoLocation,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error("[Firestore] Mood logs subscription error:", err);
      if (onError) onError(err);
    }
  );
}

export async function saveUserMoodLog(
  userId: string, 
  moodLog: Omit<MoodLog, "id" | "userId" | "createdAt" | "updatedAt"> & Partial<MoodLog>
): Promise<string> {
  if (!userId) throw new Error("User ID is required to save mood log.");
  const id = moodLog.id || `mood-${moodLog.date}`;
  const docRef = doc(db, "users", userId, "mood_logs", id);
  const now = new Date().toISOString();
  const payload = sanitizeForFirestore({
    ...moodLog,
    id,
    userId,
    createdAt: moodLog.createdAt || now,
    updatedAt: now,
  });
  await setDoc(docRef, payload, { merge: true });
  return id;
}

// ==========================================
// 3. MONTHLY PLANS (/users/{userId}/monthly_plans)
// ==========================================
export function subscribeToMonthlyPlan(
  userId: string,
  monthKey: string,
  onUpdate: (plan: MonthlyPlan | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId || !monthKey) {
    onUpdate(null);
    return () => {};
  }

  const docRef = doc(db, "users", userId, "monthly_plans", monthKey);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          id: docSnap.id,
          userId: data.userId || userId,
          monthKey: data.monthKey || monthKey,
          plansRaw: data.plansRaw || "",
          todos: data.todos || [],
          endOfMonthReview: data.endOfMonthReview || "",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error("[Firestore] Monthly plan subscription error:", err);
      if (onError) onError(err);
    }
  );
}

export async function saveMonthlyPlan(userId: string, plan: Partial<MonthlyPlan> & { monthKey: string }): Promise<void> {
  if (!userId || !plan.monthKey) throw new Error("User ID and monthKey required.");
  const docRef = doc(db, "users", userId, "monthly_plans", plan.monthKey);
  const payload = sanitizeForFirestore({
    ...plan,
    id: plan.monthKey,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, payload, { merge: true });
}

// ==========================================
// 4. HABITS (/users/{userId}/habits)
// ==========================================
export function getHabitsCollection(userId: string) {
  if (!userId) throw new Error("User ID is required for habits.");
  return collection(db, "users", userId, "habits");
}

export function subscribeToUserHabits(
  userId: string,
  onUpdate: (habits: Habit[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(getHabitsCollection(userId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Habit[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          name: data.name || "Untitled Habit",
          category: data.category || "wellness",
          completedDates: data.completedDates || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error("[Firestore] Habits subscription error:", err);
      if (onError) onError(err);
    }
  );
}

export async function saveUserHabit(userId: string, habit: Habit): Promise<void> {
  if (!userId || !habit.id) throw new Error("User ID and Habit ID required.");
  const docRef = doc(db, "users", userId, "habits", habit.id);
  const payload = sanitizeForFirestore({
    ...habit,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteUserHabit(userId: string, habitId: string): Promise<void> {
  if (!userId || !habitId) return;
  const docRef = doc(db, "users", userId, "habits", habitId);
  await deleteDoc(docRef);
}

// ==========================================
// 5. BUCKET LIST (/users/{userId}/bucket_list)
// ==========================================
export function getBucketCollection(userId: string) {
  if (!userId) throw new Error("User ID is required for bucket list.");
  return collection(db, "users", userId, "bucket_list");
}

export function subscribeToBucketItems(
  userId: string,
  onUpdate: (items: BucketItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(getBucketCollection(userId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: BucketItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || "Untitled Aspiration",
          description: data.description || "",
          category: data.category || "personal",
          targetDate: data.targetDate || "",
          completed: Boolean(data.completed),
          completedAt: data.completedAt || "",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error("[Firestore] Bucket list subscription error:", err);
      if (onError) onError(err);
    }
  );
}

export async function saveBucketItem(userId: string, item: BucketItem): Promise<void> {
  if (!userId || !item.id) throw new Error("User ID and Item ID required.");
  const docRef = doc(db, "users", userId, "bucket_list", item.id);
  const payload = sanitizeForFirestore({
    ...item,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteBucketItem(userId: string, itemId: string): Promise<void> {
  if (!userId || !itemId) return;
  const docRef = doc(db, "users", userId, "bucket_list", itemId);
  await deleteDoc(docRef);
}

// ==========================================
// 6. USER SETTINGS (/users/{userId}/settings/prefs)
// ==========================================
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  if (!userId) return null;
  const docRef = doc(db, "users", userId, "settings", "preferences");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    userId,
    theme: d.theme === "dark" ? "dark" : "light",
    dailyReminderEnabled: d.dailyReminderEnabled ?? true,
    dailyReminderTime: d.dailyReminderTime || "20:00",
    eveningCheckinEnabled: d.eveningCheckinEnabled ?? true,
    updatedAt: d.updatedAt || new Date().toISOString(),
  };
}

export async function saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "settings", "preferences");
  const payload = sanitizeForFirestore({
    ...settings,
    userId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, payload, { merge: true });
}

// ==========================================
// 7. HARD DELETE ALL USER DATA FROM FIREBASE
// ==========================================
export async function deleteAllUserDataFromFirebase(userId: string): Promise<void> {
  if (!userId) throw new Error("User ID required for deletion.");

  const collectionsToDelete = [
    "reflections",
    "mood_logs",
    "monthly_plans",
    "habits",
    "bucket_list",
    "settings"
  ];

  for (const collName of collectionsToDelete) {
    try {
      const colRef = collection(db, "users", userId, collName);
      const snap = await getDocs(colRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn(`[Firestore] Failed deleting collection ${collName}:`, e);
    }
  }

  // Also remove user root doc if exists
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (e) {
    // ignore
  }
}
