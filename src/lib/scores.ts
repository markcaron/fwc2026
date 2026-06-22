import type { Match } from './types.js';

// ── Payload shape ────────────────────────────────────────────

/**
 * A single match result entry. Only `home` and `away` are required.
 * `status` defaults to 'completed' when omitted.
 * `homePenalty` / `awayPenalty` are only set for knock-out matches
 * decided on penalties.
 */
export interface ScoreEntry {
  /** Score values are optional — a live match may have status:'live' before
   *  the API populates a score (free-tier delay, early first half, etc.) */
  home?:         number;
  away?:         number;
  status?:       'live' | 'completed';
  homePenalty?:  number;
  awayPenalty?:  number;
  /** Resolved team IDs for knockout slots — written when ESPN confirms the
   *  pairing in a scheduled (pre-state) event before the match kicks off. */
  homeId?:       string;
  awayId?:       string;
}

/**
 * The full JSON payload. Only include matches that have results — scheduled
 * matches are omitted and the app uses the static fallback (null scores).
 *
 * Example:
 * {
 *   "updated": "2026-06-11T20:15:00Z",
 *   "scores": {
 *     "1": { "home": 0, "away": 0, "status": "completed" },
 *     "2": { "home": 2, "away": 1, "status": "completed" }
 *   }
 * }
 */
export interface ScoresPayload {
  updated: string;
  scores:  Record<string, ScoreEntry>;
}

// ── Fetch ────────────────────────────────────────────────────

/**
 * Fetch the scores payload from `url`.
 * - Appends `?t=<epoch>` to bypass CDN caches (e.g. GitHub raw content's
 *   ~5 min cache).
 * - Times out after 5 s.
 * - Returns null on any error so the caller can fall back to static data.
 */
export async function fetchScores(url: string): Promise<ScoresPayload | null> {
  if (!url) return null;
  try {
    const res = await fetch(`${url}?t=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as ScoresPayload;
  } catch {
    return null;
  }
}

// ── Merge ────────────────────────────────────────────────────

/**
 * Overlay a fetched scores payload onto the static matches array.
 * Returns a new array — the static MATCHES constant is never mutated.
 * Matches not present in the payload are returned unchanged (status:
 * 'scheduled', scores: null).
 */
export function applyScores(
  matches: readonly Match[],
  payload: ScoresPayload | null,
): Match[] {
  if (!payload || !payload.scores) return [...matches];
  return matches.map(m => {
    const s = payload.scores[String(m.id)];
    if (!s) return m;
    return {
      ...m,
      homeScore:    s.home    ?? null,  // null when score not yet available (live)
      awayScore:    s.away    ?? null,
      status:       s.status  ?? m.status,
      homePenalty:  s.homePenalty ?? null,
      awayPenalty:  s.awayPenalty ?? null,
      // Overlay confirmed knockout team IDs when present; fall back to the
      // static value (null for group-stage TBD slots, team id for group matches)
      homeId:       s.homeId  ?? m.homeId,
      awayId:       s.awayId  ?? m.awayId,
    };
  });
}
