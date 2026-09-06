export interface SavedAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastActive: number;
}

const STORAGE_KEY = 'sols_saved_accounts_v1';
const LEGACY_STORAGE_KEY = 'ephemeris_saved_accounts_v1';

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn("Failed to load saved accounts from storage:", err);
    return [];
  }
}

export function saveAccount(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): SavedAccount[] {
  try {
    const current = getSavedAccounts();
    const existingIndex = current.findIndex(acc => acc.uid === user.uid || (acc.email && user.email && acc.email.toLowerCase() === user.email.toLowerCase()));
    
    const accountEntry: SavedAccount = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastActive: Date.now()
    };

    let updated: SavedAccount[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = accountEntry;
    } else {
      updated = [accountEntry, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to save account to storage:", err);
    return getSavedAccounts();
  }
}

export function removeSavedAccount(uid: string): SavedAccount[] {
  try {
    const current = getSavedAccounts();
    const updated = current.filter(acc => acc.uid !== uid);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to remove saved account:", err);
    return getSavedAccounts();
  }
}

export function clearSavedAccounts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear saved accounts:", err);
  }
}
