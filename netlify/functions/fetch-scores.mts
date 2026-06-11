/**
 * Netlify Scheduled Function — runs every 5 minutes.
 *
 * Fetches live / completed match scores from football-data.org and writes
 * the result to Netlify Blobs. The frontend reads from /api/scores (see
 * scores.mts), so no rebuild is ever needed to update results.
 *
 * Required environment variable (set in Netlify dashboard):
 *   FOOTBALL_DATA_API_KEY  — free tier at https://www.football-data.org/client/register
 *
 * football-data.org competition code for FIFA World Cup: "WC"
 * (verify at https://api.football-data.org/v4/competitions if not working)
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// ── Team TLA → internal ID ────────────────────────────────────────────────────
// Maps football-data.org 3-letter codes to our internal team IDs.
// Add aliases for codes that might differ between data sources.
const TEAM_BY_TLA: Record<string, string> = {
  MEX: 'mex', RSA: 'zaf', KOR: 'kor', CZE: 'cze',
  CAN: 'can', SUI: 'sui', QAT: 'qat', BIH: 'bih',
  BRA: 'bra', MAR: 'mar', SCO: 'sco', HAI: 'hai', HTI: 'hai',
  USA: 'usa', PAR: 'par', AUS: 'aus', TUR: 'tur',
  GER: 'ger', CUW: 'cur', CIV: 'civ',  ECU: 'ecu',
  NED: 'ned', JPN: 'jpn', TUN: 'tun',  SWE: 'swe',
  BEL: 'bel', EGY: 'egy', IRN: 'irn',  IRI: 'irn', // Iran has two common codes
  NZL: 'nzl', NZE: 'nzl',
  ESP: 'esp', CPV: 'cpv', CVE: 'cpv',  KSA: 'ksa', SAU: 'ksa',
  URU: 'uru', FRA: 'fra', SEN: 'sen',  NOR: 'nor', IRQ: 'irq',
  ARG: 'arg', ALG: 'alg', DZA: 'alg', AUT: 'aut', JOR: 'jor',
  POR: 'por', UZB: 'uzb', COL: 'col',  COD: 'cod', DRC: 'cod',
  ENG: 'eng', CRO: 'cro', GHA: 'gha', PAN: 'pan',
};

// ── Fixture table: all 104 matches ───────────────────────────────────────────
// Group stage: homeId + awayId are our internal team IDs.
// Knockout stage: homeId/awayId are null until teams qualify;
//   these are matched by UTC time instead.
interface Fixture {
  id: number;
  home: string | null;  // internal team ID
  away: string | null;
  utc: string;          // ISO 8601 UTC
}

const FIXTURES: Fixture[] = [
  // ── Group A ──────────────────────────────────────────────────
  { id:  1, home:'mex', away:'zaf', utc:'2026-06-11T19:00:00Z' },
  { id:  2, home:'kor', away:'cze', utc:'2026-06-12T02:00:00Z' },
  { id: 25, home:'cze', away:'zaf', utc:'2026-06-18T16:00:00Z' },
  { id: 28, home:'mex', away:'kor', utc:'2026-06-19T01:00:00Z' },
  { id: 53, home:'cze', away:'mex', utc:'2026-06-25T01:00:00Z' },
  { id: 54, home:'zaf', away:'kor', utc:'2026-06-25T01:00:00Z' },
  // ── Group B ──────────────────────────────────────────────────
  { id:  3, home:'can', away:'bih', utc:'2026-06-12T19:00:00Z' },
  { id:  8, home:'qat', away:'sui', utc:'2026-06-13T19:00:00Z' },
  { id: 26, home:'sui', away:'bih', utc:'2026-06-18T19:00:00Z' },
  { id: 27, home:'can', away:'qat', utc:'2026-06-18T22:00:00Z' },
  { id: 51, home:'sui', away:'can', utc:'2026-06-24T19:00:00Z' },
  { id: 52, home:'bih', away:'qat', utc:'2026-06-24T19:00:00Z' },
  // ── Group C ──────────────────────────────────────────────────
  { id:  7, home:'bra', away:'mar', utc:'2026-06-13T22:00:00Z' },
  { id:  5, home:'hai', away:'sco', utc:'2026-06-14T01:00:00Z' },
  { id: 30, home:'sco', away:'mar', utc:'2026-06-19T22:00:00Z' },
  { id: 29, home:'bra', away:'hai', utc:'2026-06-20T01:00:00Z' },
  { id: 49, home:'sco', away:'bra', utc:'2026-06-24T22:00:00Z' },
  { id: 50, home:'mar', away:'hai', utc:'2026-06-24T22:00:00Z' },
  // ── Group D ──────────────────────────────────────────────────
  { id:  4, home:'usa', away:'par', utc:'2026-06-13T01:00:00Z' },
  { id:  6, home:'aus', away:'tur', utc:'2026-06-14T04:00:00Z' },
  { id: 32, home:'usa', away:'aus', utc:'2026-06-19T19:00:00Z' },
  { id: 31, home:'tur', away:'par', utc:'2026-06-20T03:00:00Z' },
  { id: 59, home:'tur', away:'usa', utc:'2026-06-26T02:00:00Z' },
  { id: 60, home:'par', away:'aus', utc:'2026-06-26T02:00:00Z' },
  // ── Group E ──────────────────────────────────────────────────
  { id: 10, home:'ger', away:'cur', utc:'2026-06-14T17:00:00Z' },
  { id:  9, home:'civ', away:'ecu', utc:'2026-06-14T23:00:00Z' },
  { id: 33, home:'ger', away:'civ', utc:'2026-06-20T20:00:00Z' },
  { id: 34, home:'ecu', away:'cur', utc:'2026-06-21T00:00:00Z' },
  { id: 55, home:'cur', away:'civ', utc:'2026-06-25T20:00:00Z' },
  { id: 56, home:'ecu', away:'ger', utc:'2026-06-25T20:00:00Z' },
  // ── Group F ──────────────────────────────────────────────────
  { id: 11, home:'ned', away:'jpn', utc:'2026-06-14T20:00:00Z' },
  { id: 12, home:'swe', away:'tun', utc:'2026-06-15T02:00:00Z' },
  { id: 35, home:'ned', away:'swe', utc:'2026-06-20T17:00:00Z' },
  { id: 36, home:'tun', away:'jpn', utc:'2026-06-21T04:00:00Z' },
  { id: 57, home:'jpn', away:'swe', utc:'2026-06-25T23:00:00Z' },
  { id: 58, home:'tun', away:'ned', utc:'2026-06-25T23:00:00Z' },
  // ── Group G ──────────────────────────────────────────────────
  { id: 16, home:'bel', away:'egy', utc:'2026-06-15T19:00:00Z' },
  { id: 15, home:'irn', away:'nzl', utc:'2026-06-16T01:00:00Z' },
  { id: 39, home:'bel', away:'irn', utc:'2026-06-21T19:00:00Z' },
  { id: 40, home:'nzl', away:'egy', utc:'2026-06-22T01:00:00Z' },
  { id: 63, home:'egy', away:'irn', utc:'2026-06-27T03:00:00Z' },
  { id: 64, home:'nzl', away:'bel', utc:'2026-06-27T03:00:00Z' },
  // ── Group H ──────────────────────────────────────────────────
  { id: 14, home:'esp', away:'cpv', utc:'2026-06-15T16:00:00Z' },
  { id: 13, home:'ksa', away:'uru', utc:'2026-06-15T22:00:00Z' },
  { id: 38, home:'esp', away:'ksa', utc:'2026-06-21T16:00:00Z' },
  { id: 37, home:'uru', away:'cpv', utc:'2026-06-21T22:00:00Z' },
  { id: 65, home:'cpv', away:'ksa', utc:'2026-06-27T00:00:00Z' },
  { id: 66, home:'uru', away:'esp', utc:'2026-06-27T00:00:00Z' },
  // ── Group I ──────────────────────────────────────────────────
  { id: 17, home:'fra', away:'sen', utc:'2026-06-16T19:00:00Z' },
  { id: 18, home:'irq', away:'nor', utc:'2026-06-16T22:00:00Z' },
  { id: 42, home:'fra', away:'irq', utc:'2026-06-22T21:00:00Z' },
  { id: 41, home:'nor', away:'sen', utc:'2026-06-23T00:00:00Z' },
  { id: 61, home:'nor', away:'fra', utc:'2026-06-26T19:00:00Z' },
  { id: 62, home:'sen', away:'irq', utc:'2026-06-26T19:00:00Z' },
  // ── Group J ──────────────────────────────────────────────────
  { id: 19, home:'arg', away:'alg', utc:'2026-06-17T01:00:00Z' },
  { id: 20, home:'aut', away:'jor', utc:'2026-06-17T04:00:00Z' },
  { id: 43, home:'arg', away:'aut', utc:'2026-06-22T17:00:00Z' },
  { id: 44, home:'jor', away:'alg', utc:'2026-06-23T03:00:00Z' },
  { id: 69, home:'alg', away:'aut', utc:'2026-06-28T02:00:00Z' },
  { id: 70, home:'jor', away:'arg', utc:'2026-06-28T02:00:00Z' },
  // ── Group K ──────────────────────────────────────────────────
  { id: 23, home:'por', away:'cod', utc:'2026-06-17T17:00:00Z' },
  { id: 24, home:'uzb', away:'col', utc:'2026-06-18T02:00:00Z' },
  { id: 47, home:'por', away:'uzb', utc:'2026-06-23T17:00:00Z' },
  { id: 48, home:'col', away:'cod', utc:'2026-06-24T02:00:00Z' },
  { id: 71, home:'col', away:'por', utc:'2026-06-27T23:30:00Z' },
  { id: 72, home:'cod', away:'uzb', utc:'2026-06-27T23:30:00Z' },
  // ── Group L ──────────────────────────────────────────────────
  { id: 22, home:'eng', away:'cro', utc:'2026-06-17T20:00:00Z' },
  { id: 21, home:'gha', away:'pan', utc:'2026-06-17T23:00:00Z' },
  { id: 45, home:'eng', away:'gha', utc:'2026-06-23T20:00:00Z' },
  { id: 46, home:'pan', away:'cro', utc:'2026-06-23T23:00:00Z' },
  { id: 67, home:'pan', away:'eng', utc:'2026-06-27T21:00:00Z' },
  { id: 68, home:'cro', away:'gha', utc:'2026-06-27T21:00:00Z' },
  // ── Round of 32 (knockout — teams TBD, matched by UTC time) ──
  { id: 73, home:null, away:null, utc:'2026-06-28T19:00:00Z' },
  { id: 74, home:null, away:null, utc:'2026-06-29T20:30:00Z' },
  { id: 75, home:null, away:null, utc:'2026-06-30T01:00:00Z' },
  { id: 76, home:null, away:null, utc:'2026-06-29T17:00:00Z' },
  { id: 77, home:null, away:null, utc:'2026-06-30T21:00:00Z' },
  { id: 78, home:null, away:null, utc:'2026-06-30T17:00:00Z' },
  { id: 79, home:null, away:null, utc:'2026-07-01T01:00:00Z' },
  { id: 80, home:null, away:null, utc:'2026-07-01T16:00:00Z' },
  { id: 81, home:null, away:null, utc:'2026-07-02T00:00:00Z' },
  { id: 82, home:null, away:null, utc:'2026-07-01T20:00:00Z' },
  { id: 83, home:null, away:null, utc:'2026-07-02T23:00:00Z' },
  { id: 84, home:null, away:null, utc:'2026-07-02T19:00:00Z' },
  { id: 85, home:null, away:null, utc:'2026-07-03T03:00:00Z' },
  { id: 86, home:null, away:null, utc:'2026-07-03T22:00:00Z' },
  { id: 87, home:null, away:null, utc:'2026-07-04T01:30:00Z' },
  { id: 88, home:null, away:null, utc:'2026-07-03T18:00:00Z' },
  // ── Round of 16 ──────────────────────────────────────────────
  { id: 89, home:null, away:null, utc:'2026-07-04T21:00:00Z' },
  { id: 90, home:null, away:null, utc:'2026-07-04T17:00:00Z' },
  { id: 91, home:null, away:null, utc:'2026-07-05T20:00:00Z' },
  { id: 92, home:null, away:null, utc:'2026-07-06T00:00:00Z' },
  { id: 93, home:null, away:null, utc:'2026-07-06T19:00:00Z' },
  { id: 94, home:null, away:null, utc:'2026-07-07T00:00:00Z' },
  { id: 95, home:null, away:null, utc:'2026-07-07T16:00:00Z' },
  { id: 96, home:null, away:null, utc:'2026-07-07T20:00:00Z' },
  // ── Quarterfinals ────────────────────────────────────────────
  { id: 97, home:null, away:null, utc:'2026-07-09T20:00:00Z' },
  { id: 98, home:null, away:null, utc:'2026-07-10T19:00:00Z' },
  { id: 99, home:null, away:null, utc:'2026-07-11T21:00:00Z' },
  { id:100, home:null, away:null, utc:'2026-07-12T01:00:00Z' },
  // ── Semifinals ───────────────────────────────────────────────
  { id:101, home:null, away:null, utc:'2026-07-14T19:00:00Z' },
  { id:102, home:null, away:null, utc:'2026-07-15T19:00:00Z' },
  // ── Third-place ───────────────────────────────────────────────
  { id:103, home:null, away:null, utc:'2026-07-18T21:00:00Z' },
  // ── Final ─────────────────────────────────────────────────────
  { id:104, home:null, away:null, utc:'2026-07-19T19:00:00Z' },
];

// ── Lookup tables ─────────────────────────────────────────────────────────────
// Primary: home:away internal IDs → our match ID (group stage)
const BY_TEAMS = new Map<string, number>();
// Fallback: UTC epoch rounded to nearest minute → our match ID (knockout)
const BY_TIME  = new Map<number, number>();

for (const f of FIXTURES) {
  if (f.home && f.away) {
    BY_TEAMS.set(`${f.home}:${f.away}`, f.id);
  }
  // Round to nearest minute for time-based lookup
  BY_TIME.set(Math.round(new Date(f.utc).getTime() / 60000), f.id);
}

// ── football-data.org types ───────────────────────────────────────────────────
interface FDScore {
  fullTime: { home: number | null; away: number | null };
  penalties?: { home: number | null; away: number | null };
}
interface FDMatch {
  status: string;  // SCHEDULED | IN_PLAY | PAUSED | FINISHED | ...
  utcDate: string;
  homeTeam: { tla: string };
  awayTeam: { tla: string };
  score: FDScore;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(): Promise<Response> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    console.error('[fetch-scores] FOOTBALL_DATA_API_KEY is not set');
    return new Response('missing API key', { status: 500 });
  }

  let matches: FDMatch[];
  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': apiKey } },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`[fetch-scores] upstream ${res.status}:`, body);
      return new Response('upstream error', { status: 502 });
    }
    const data = (await res.json()) as { matches: FDMatch[] };
    matches = data.matches ?? [];
  } catch (err) {
    console.error('[fetch-scores] fetch failed:', err);
    return new Response('fetch error', { status: 500 });
  }

  // Build the scores payload in our format
  const scores: Record<string, {
    home?: number; away?: number; status: string;
    homePenalty?: number; awayPenalty?: number;
  }> = {};

  for (const m of matches) {
    if (m.status !== 'FINISHED' && m.status !== 'IN_PLAY' && m.status !== 'PAUSED') {
      continue;
    }

    const isFinished = m.status === 'FINISHED';
    const status     = isFinished ? 'completed' : 'live';

    // Best available score: fullTime first, then halfTime (available from 45'+)
    // Free tier has a ~10 min delay, so during early first half both may be null.
    const ft   = m.score.fullTime;
    const ht   = m.score.halfTime;
    const home = ft.home !== null ? ft.home
               : ht?.home !== null ? ht!.home!
               : undefined;
    const away = ft.away !== null ? ft.away
               : ht?.away !== null ? ht!.away!
               : undefined;

    // Skip finished matches with no score (data issue — shouldn't happen)
    if (isFinished && (home === undefined || away === undefined)) {
      console.warn(`[fetch-scores] FINISHED with no score: ${m.homeTeam.tla} v ${m.awayTeam.tla}`);
      continue;
    }
    // For live matches: always include even if score is not available yet,
    // so the UI can show the "Live" indicator.

    // --- Find our internal match ID ---
    let ourId: number | undefined;

    // 1. Try by team codes (works for all matches where teams are known)
    const hId = TEAM_BY_TLA[m.homeTeam.tla?.toUpperCase()];
    const aId = TEAM_BY_TLA[m.awayTeam.tla?.toUpperCase()];
    if (hId && aId) {
      ourId = BY_TEAMS.get(`${hId}:${aId}`);
    }

    // 2. Fall back to UTC time (for knockout matches before team mapping is known,
    //    and for any team TLA mismatch). Tolerance: ±5 min.
    if (ourId === undefined) {
      const apiMin = Math.round(new Date(m.utcDate).getTime() / 60000);
      for (let delta = 0; delta <= 5; delta++) {
        ourId = BY_TIME.get(apiMin + delta) ?? BY_TIME.get(apiMin - delta);
        if (ourId !== undefined) break;
      }
    }

    if (ourId === undefined) {
      console.warn(`[fetch-scores] no match found for ${m.homeTeam.tla} vs ${m.awayTeam.tla} @ ${m.utcDate}`);
      continue;
    }

    const entry: typeof scores[string] = { status };
    if (home !== undefined && away !== undefined) {
      entry.home = home;
      entry.away = away;
    }
    if (m.score.penalties?.home != null && m.score.penalties.away != null) {
      entry.homePenalty = m.score.penalties.home;
      entry.awayPenalty = m.score.penalties.away;
    }
    scores[String(ourId)] = entry;
  }

  // Write to Netlify Blobs
  try {
    const store = getStore('scores');
    await store.setJSON('latest', { updated: new Date().toISOString(), scores });
    console.log(`[fetch-scores] saved ${Object.keys(scores).length} result(s)`);
  } catch (err) {
    console.error('[fetch-scores] blob write failed:', err);
    return new Response('blob error', { status: 500 });
  }

  return new Response('OK');
}

export const config: Config = {
  schedule: '*/5 * * * *',  // every 5 minutes
};
