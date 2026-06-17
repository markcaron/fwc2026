import type { StoredPreferences } from './types.js';
import { SCHEMA_VERSION } from './types.js';

const STORAGE_KEY = 'fwc2026_prefs';

const DEFAULTS: StoredPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  favoriteTeamIds: [],
  notificationsEnabled: false,
  notificationScope: 'favorites',
  schemaVersion: SCHEMA_VERSION,
};

export function loadPreferences(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;

    // Schema migration
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      return { ...DEFAULTS, ...parsed, schemaVersion: SCHEMA_VERSION };
    }

    return {
      timezone: parsed.timezone ?? DEFAULTS.timezone,
      favoriteTeamIds: Array.isArray(parsed.favoriteTeamIds) ? parsed.favoriteTeamIds : [],
      notificationsEnabled: parsed.notificationsEnabled ?? false,
      notificationScope: parsed.notificationScope === 'all' ? 'all' : 'favorites',
      schemaVersion: SCHEMA_VERSION,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs: StoredPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, schemaVersion: SCHEMA_VERSION }));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.) — fail silently
  }
}

export function updatePreferences(partial: Partial<StoredPreferences>): StoredPreferences {
  const current = loadPreferences();
  const updated = { ...current, ...partial };
  savePreferences(updated);
  return updated;
}
