/**
 * Netlify Scheduled Function — runs every 5 minutes.
 *
 * Fetches live / completed match scores from ESPN's unofficial public
 * scoreboard API (no authentication required) and writes the result to
 * Netlify Blobs. The frontend reads from /api/scores (see scores.mts).
 *
 * Why ESPN instead of football-data.org:
 *   football-data.org free tier shows WC 2026 matches as "TIMED" even during
 *   play — live data is paywalled. ESPN's public scoreboard API has no
 *   authentication requirement and updates in real time.
 *
 * No environment variables required — just deploy and it works.
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

// ── Team abbreviation → internal ID ──────────────────────────────────────────
// ESPN uses standard FIFA abbreviations for most teams; aliases cover
// known variations.
const TEAM_BY_ABB: Record<string, string> = {
  MEX: 'mex',
  RSA: 'zaf', ZAF: 'zaf',
  KOR: 'kor',
  CZE: 'cze',
  CAN: 'can',
  SUI: 'sui',
  QAT: 'qat',
  BIH: 'bih',
  BRA: 'bra',
  MAR: 'mar',
  SCO: 'sco',
  HAI: 'hai', HTI: 'hai',
  USA: 'usa',
  PAR: 'par',
  AUS: 'aus',
  TUR: 'tur',
  GER: 'ger',
  CUW: 'cur', CUR: 'cur',
  CIV: 'civ', CDI: 'civ',
  ECU: 'ecu',
  NED: 'ned',
  JPN: 'jpn',
  TUN: 'tun',
  SWE: 'swe',
  BEL: 'bel',
  EGY: 'egy',
  IRN: 'irn', IRI: 'irn',
  NZL: 'nzl',
  ESP: 'esp',
  CPV: 'cpv', CVE: 'cpv',
  KSA: 'ksa', SAU: 'ksa',
  URU: 'uru',
  FRA: 'fra',
  SEN: 'sen',
  NOR: 'nor',
  IRQ: 'irq',
  ARG: 'arg',
  ALG: 'alg', DZA: 'alg',
  AUT: 'aut',
  JOR: 'jor',
  POR: 'por',
  UZB: 'uzb',
  COL: 'col',
  COD: 'cod', DRC: 'cod', CGO: 'cod',
  ENG: 'eng',
  CRO: 'cro',
  GHA: 'gha',
  PAN: 'pan',
};

// ── Fixture table: all 104 matches ───────────────────────────────────────────
// Group stage: homeId + awayId are our internal team IDs.
// Knockout stage: homeId/awayId are null until teams qualify — matched by UTC
// time instead.
interface Fixture {
  id:   number;
  home: string | null;
  away: string | null;
  utc:  string;
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
  // ── Knockout (teams TBD — matched by UTC time) ────────────────
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
  { id: 89, home:null, away:null, utc:'2026-07-04T21:00:00Z' },
  { id: 90, home:null, away:null, utc:'2026-07-04T17:00:00Z' },
  { id: 91, home:null, away:null, utc:'2026-07-05T20:00:00Z' },
  { id: 92, home:null, away:null, utc:'2026-07-06T00:00:00Z' },
  { id: 93, home:null, away:null, utc:'2026-07-06T19:00:00Z' },
  { id: 94, home:null, away:null, utc:'2026-07-07T00:00:00Z' },
  { id: 95, home:null, away:null, utc:'2026-07-07T16:00:00Z' },
  { id: 96, home:null, away:null, utc:'2026-07-07T20:00:00Z' },
  { id: 97, home:null, away:null, utc:'2026-07-09T20:00:00Z' },
  { id: 98, home:null, away:null, utc:'2026-07-10T19:00:00Z' },
  { id: 99, home:null, away:null, utc:'2026-07-11T21:00:00Z' },
  { id:100, home:null, away:null, utc:'2026-07-12T01:00:00Z' },
  { id:101, home:null, away:null, utc:'2026-07-14T19:00:00Z' },
  { id:102, home:null, away:null, utc:'2026-07-15T19:00:00Z' },
  { id:103, home:null, away:null, utc:'2026-07-18T21:00:00Z' },
  { id:104, home:null, away:null, utc:'2026-07-19T19:00:00Z' },
];

// ── Lookup tables ─────────────────────────────────────────────────────────────
const BY_TEAMS = new Map<string, number>();
const BY_TIME  = new Map<number, number>();

for (const f of FIXTURES) {
  if (f.home && f.away) BY_TEAMS.set(`${f.home}:${f.away}`, f.id);
  BY_TIME.set(Math.round(new Date(f.utc).getTime() / 60000), f.id);
}

// ── ESPN types ────────────────────────────────────────────────────────────────
interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  score:    string;
  team: { abbreviation: string };
}
interface ESPNStatusType {
  name:      string;   // STATUS_FINAL | STATUS_IN_PROGRESS | STATUS_HALFTIME | STATUS_SCHEDULED | …
  state:     string;   // 'pre' | 'in' | 'post'
  completed: boolean;
}
interface ESPNEvent {
  date: string;
  competitions: [{
    status:      { type: ESPNStatusType };
    competitors: ESPNCompetitor[];
  }];
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(): Promise<Response> {
  let events: ESPNEvent[];
  try {
    const res = await fetch(ESPN_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.error(`[fetch-scores] ESPN ${res.status}`);
      return new Response('upstream error', { status: 502 });
    }
    const data = (await res.json()) as { events?: ESPNEvent[] };
    events = data.events ?? [];
  } catch (err) {
    console.error('[fetch-scores] ESPN fetch failed:', err);
    return new Response('fetch error', { status: 500 });
  }

  const newScores: Record<string, {
    home?: number; away?: number; status?: string;
    homePenalty?: number; awayPenalty?: number;
    homeId?: string; awayId?: string;
  }> = {};

  // ── Pass 1: live / completed scores from today's feed ─────────────────────
  for (const evt of events) {
    const comp   = evt.competitions[0];
    const state  = comp.status.type.state;      // 'pre' | 'in' | 'post'
    const isLive = state === 'in';
    const isDone = state === 'post';

    if (!isLive && !isDone) continue;

    // Get home/away teams by homeAway field (don't assume array order)
    const homeC = comp.competitors.find(c => c.homeAway === 'home');
    const awayC = comp.competitors.find(c => c.homeAway === 'away');
    if (!homeC || !awayC) continue;

    const hAbb = homeC.team.abbreviation?.toUpperCase();
    const aAbb = awayC.team.abbreviation?.toUpperCase();
    const hId  = TEAM_BY_ABB[hAbb];
    const aId  = TEAM_BY_ABB[aAbb];

    // Find our internal match ID: team pair first, UTC time as fallback
    let ourId = (hId && aId) ? BY_TEAMS.get(`${hId}:${aId}`) : undefined;
    if (ourId === undefined) {
      const evtMin = Math.round(new Date(evt.date).getTime() / 60000);
      for (let d = 0; d <= 10; d++) {
        ourId = BY_TIME.get(evtMin + d) ?? BY_TIME.get(evtMin - d);
        if (ourId !== undefined) break;
      }
    }

    if (ourId === undefined) {
      console.warn(`[fetch-scores] no match found: ${hAbb} vs ${aAbb} @ ${evt.date}`);
      continue;
    }

    const homeScore = parseInt(homeC.score, 10);
    const awayScore = parseInt(awayC.score, 10);
    const entry: typeof newScores[string] = { status: isDone ? 'completed' : 'live' };

    if (!isNaN(homeScore) && !isNaN(awayScore)) {
      entry.home = homeScore;
      entry.away = awayScore;
    }

    newScores[String(ourId)] = entry;
  }

  // ── Pass 2: confirmed knockout team pairings from future dates ────────────
  // The default /scoreboard endpoint only returns today's group-stage matches.
  // Confirmed knockout teams (e.g. Germany, USA, Mexico) only appear when
  // querying the specific match date via ?dates=YYYYMMDD.
  // Probe each unique knockout date in the next 7 days so confirmed slots
  // populate before those matches kick off.
  const now = new Date();
  const probeCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const knockoutDates = new Set<string>();

  for (const f of FIXTURES) {
    if (f.home !== null && f.away !== null) continue; // skip group-stage fixtures
    const kickoff = new Date(f.utc);
    if (kickoff > now && kickoff <= probeCutoff) {
      const y   = kickoff.getUTCFullYear();
      const mon = String(kickoff.getUTCMonth() + 1).padStart(2, '0');
      const day = String(kickoff.getUTCDate()).padStart(2, '0');
      knockoutDates.add(`${y}${mon}${day}`);
    }
  }

  // Probe all upcoming knockout dates in parallel — sequential awaits could
  // approach the function timeout during rounds with 3–5 distinct match dates
  const probeResults = await Promise.allSettled(
    [...knockoutDates].map(async dateStr => {
      const res = await fetch(
        `https://site.web.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=50&dates=${dateStr}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { events?: ESPNEvent[] };
      return { dateStr, events: data.events ?? [] };
    })
  );

  for (const result of probeResults) {
    if (result.status === 'rejected') {
      console.warn(`[fetch-scores] knockout probe failed:`, result.reason);
      continue;
    }
    const { dateStr, events: dateEvents } = result.value;

    for (const evt of dateEvents) {
      const comp = evt.competitions[0];
      if (comp.status.type.state !== 'pre') continue;

      const homeC = comp.competitors.find(c => c.homeAway === 'home');
      const awayC = comp.competitors.find(c => c.homeAway === 'away');
      if (!homeC || !awayC) continue;

      const hAbb = homeC.team.abbreviation?.toUpperCase();
      const aAbb = awayC.team.abbreviation?.toUpperCase();
      const hId  = TEAM_BY_ABB[hAbb];
      const aId  = TEAM_BY_ABB[aAbb];

      // Skip if neither team resolves — pure slot labels like '2A', '3RD'
      if (!hId && !aId) continue;

      // Knockout fixtures always matched by UTC time (homeId/awayId are null
      // in our fixture table, so BY_TEAMS won't find them)
      const evtMin = Math.round(new Date(evt.date).getTime() / 60000);
      let ourId: number | undefined;
      for (let d = 0; d <= 10; d++) {
        ourId = BY_TIME.get(evtMin + d) ?? BY_TIME.get(evtMin - d);
        if (ourId !== undefined) break;
      }

      if (ourId === undefined) {
        console.warn(`[fetch-scores] knockout probe ${dateStr}: no match @ ${evt.date}`);
        continue;
      }

      // Write whichever team(s) are confirmed; the other slot stays null (TBD)
      // until ESPN confirms that team. Partial resolution is intentional.
      const existing = newScores[String(ourId)] ?? {};
      newScores[String(ourId)] = {
        ...existing,
        ...(hId ? { homeId: hId } : {}),
        ...(aId ? { awayId: aId } : {}),
      };
      console.log(`[fetch-scores] knockout slot match ${ourId}: home=${hId ?? 'TBD'} away=${aId ?? 'TBD'}`);
    }
  }

  // Merge with existing Blobs data so past results are never lost
  const store = getStore('scores');
  const existing = await store.get('latest', { type: 'json' }).catch(() => null) as
    { scores?: Record<string, unknown> } | null;
  const merged = { ...(existing?.scores ?? {}), ...newScores };

  await store.setJSON('latest', { updated: new Date().toISOString(), scores: merged });
  console.log(`[fetch-scores] ${Object.keys(newScores).length} updated, ${Object.keys(merged).length} total`);

  return new Response('OK');
}

export const config: Config = {
  schedule: '*/5 * * * *',
};
