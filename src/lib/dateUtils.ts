/**
 * Centralized Date Utilities for Sols
 * Ensures consistent local timezone handling across mood tracking, habits, and journals.
 * Avoids UTC offset bugs where evening/night entries jump to the previous or next day.
 */

/**
 * Converts a Date, ISO string, or timestamp into the user's LOCAL 'YYYY-MM-DD' key.
 */
export function formatLocalDateKey(input?: Date | string | number | null): string {
  if (!input) {
    const now = new Date();
    return formatParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  if (typeof input === 'string') {
    // If it's already a clean YYYY-MM-DD string without time
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return formatParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }
    return input.slice(0, 10);
  }

  const dateObj = input instanceof Date ? input : new Date(input);
  if (!isNaN(dateObj.getTime())) {
    return formatParts(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
  }

  const fallback = new Date();
  return formatParts(fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate());
}

function formatParts(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Returns today's date in local YYYY-MM-DD.
 */
export function getTodayLocalDateKey(): string {
  return formatLocalDateKey(new Date());
}

/**
 * Formats a local date key (YYYY-MM-DD) into a friendly human-readable label.
 * E.g., "Monday, Sep 7, 2026"
 */
export function formatReadableDate(dateKeyOrIso: string): string {
  if (!dateKeyOrIso) return '';
  try {
    // Avoid UTC midnight parsing issues with YYYY-MM-DD by passing year, month-1, day
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKeyOrIso)) {
      const [y, m, d] = dateKeyOrIso.split('-').map(Number);
      const localDate = new Date(y, m - 1, d);
      return localDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateKeyOrIso);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateKeyOrIso;
  }
}

/**
 * Checks if a given date string corresponds to today in local time.
 */
export function isDateKeyToday(dateKeyOrIso: string): boolean {
  if (!dateKeyOrIso) return false;
  return formatLocalDateKey(dateKeyOrIso) === getTodayLocalDateKey();
}
